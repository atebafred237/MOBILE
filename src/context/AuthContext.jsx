
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

const TOKEN_KEY = 'presencehub_token';
const USER_KEY = 'Presenza_user';
const ONBOARDED_KEY = 'Presenza_onboarded';

/* ─────────────────────────────────────────────
   AUTH PROVIDER
───────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  /* ─────────────────────────────────────────────
     RESTORE SESSION ON APP START
  ───────────────────────────────────────────── */
  useEffect(() => {
    const restore = async () => {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);

        if (onboarded) {
          setHasOnboarded(true);
        }

        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedToken) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${savedToken}`,
                Accept: 'application/json',
              },
            });

            if (res.ok) {
              const json = await res.json();

              const apiUser = json.data ?? json;
              const mappedUser = mapUser(apiUser, savedToken);

              setToken(savedToken);
              setUser(mappedUser);

              await AsyncStorage.setItem(
                USER_KEY,
                JSON.stringify(mappedUser)
              );
            } else {
              // Token is invalid
              await clearStorage();
            }
          } catch (error) {
            /*
             * Network error:
             * Keep cached user so the application can still open.
             */
            console.warn(
              'Could not verify token with API, using cached user',
              error
            );

            if (savedUser) {
              setToken(savedToken);
              setUser(JSON.parse(savedUser));
            }
          }
        }
      } catch (error) {
        console.error('Auth restore error:', error);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  /* ─────────────────────────────────────────────
     COMPLETE ONBOARDING
  ───────────────────────────────────────────── */
  const completeOnboarding = async () => {
    setHasOnboarded(true);

    await AsyncStorage.setItem(
      ONBOARDED_KEY,
      'true'
    );
  };

  /* ─────────────────────────────────────────────
     LOGIN
  ───────────────────────────────────────────── */
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: json.message || 'Login failed',
        };
      }

      const apiToken = json.access_token;

      if (!apiToken) {
        return {
          success: false,
          error: 'Authentication token was not returned by the server.',
        };
      }

      const apiUser = json.user ?? json.data ?? json;
      const mappedUser = mapUser(apiUser, apiToken);

      setToken(apiToken);
      setUser(mappedUser);

      await AsyncStorage.setItem(
        TOKEN_KEY,
        apiToken
      );

      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(mappedUser)
      );

      await completeOnboarding();

      return {
        success: true,
        role: mappedUser.role,
      };
    } catch (error) {
      console.error('Login error:', error);

      return {
        success: false,
        error: 'Network error. Check your connection.',
      };
    }
  };

  /* ─────────────────────────────────────────────
     LOGOUT
  ───────────────────────────────────────────── */
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn(
        'Logout API call failed:',
        error
      );
    } finally {
      setUser(null);
      setToken(null);

      await clearStorage();
    }
  };

  /* ─────────────────────────────────────────────
     UPDATE PROFILE PICTURE
  ───────────────────────────────────────────── */
  const updateProfilePicture = async (uri) => {
    if (!user || !token || !uri) {
      return;
    }

    try {
      const filename =
        uri.split('/').pop() || `avatar_${Date.now()}.jpg`;

      const match = /\.(\w+)$/.exec(filename);

      const extension = match
        ? match[1].toLowerCase()
        : 'jpg';

      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };

      const type =
        mimeTypes[extension] || 'image/jpeg';

      const formData = new FormData();

      formData.append('avatar', {
        uri,
        name: filename,
        type,
      });

      const res = await fetch(
        `${API_BASE_URL}/users/me/avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (res.ok) {
        const json = await res.json();

        const apiUser =
          json.data ?? json.user ?? json;

        const mappedUser = mapUser(
          {
            ...user,
            ...apiUser,
          },
          token
        );

        setUser(mappedUser);

        await AsyncStorage.setItem(
          USER_KEY,
          JSON.stringify(mappedUser)
        );
      } else {
        const errorText = await res.text();

        console.warn(
          'Avatar update failed:',
          errorText
        );

        await fallbackAvatarUpdate(uri);
      }
    } catch (error) {
      console.warn(
        'Avatar upload error:',
        error
      );

      await fallbackAvatarUpdate(uri);
    }
  };

  /* ─────────────────────────────────────────────
     FALLBACK LOCAL AVATAR UPDATE
  ───────────────────────────────────────────── */
  const fallbackAvatarUpdate = async (uri) => {
    if (!user) {
      return;
    }

    const updatedUser = {
      ...user,
      avatar: uri,
      profile_image: uri,
    };

    setUser(updatedUser);

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(updatedUser)
    );
  };

  /* ─────────────────────────────────────────────
     UPDATE PROFILE
  ───────────────────────────────────────────── */
  const updateProfile = async (changes) => {
    if (!user || !token) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/users/me/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify(changes),
        }
      );

      if (res.ok) {
        const json = await res.json();

        const apiUser =
          json.data ?? json.user ?? json;

        const mappedUser = mapUser(
          {
            ...user,
            ...apiUser,
          },
          token
        );

        setUser(mappedUser);

        await AsyncStorage.setItem(
          USER_KEY,
          JSON.stringify(mappedUser)
        );
      } else {
        console.warn(
          'Profile update failed:',
          await res.text()
        );

        // Local fallback
        const updatedUser = {
          ...user,
          ...changes,
        };

        setUser(updatedUser);

        await AsyncStorage.setItem(
          USER_KEY,
          JSON.stringify(updatedUser)
        );
      }
    } catch (error) {
      console.warn(
        'Profile update error:',
        error
      );

      // Local fallback
      const updatedUser = {
        ...user,
        ...changes,
      };

      setUser(updatedUser);

      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(updatedUser)
      );
    }
  };

  /* ─────────────────────────────────────────────
     CONTEXT
  ───────────────────────────────────────────── */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateProfilePicture,
        updateProfile,
        loading,
        hasOnboarded,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ─────────────────────────────────────────────
   USE AUTH
───────────────────────────────────────────── */
export const useAuth = () =>
  useContext(AuthContext);

/* ─────────────────────────────────────────────
   PROFILE AVATAR HELPER

   This fixes:
   getProfileAvatarUri is not a function
───────────────────────────────────────────── */
export const getProfileAvatarUri = (user) => {
  if (!user) {
    return null;
  }

  const avatar =
    user.avatar ||
    user.profile_image ||
    user.profileImage ||
    user.photo ||
    null;

  /* No avatar */
  if (!avatar) {
    const identifier =
      user.email ||
      user.id ||
      'user';

    return `https://i.pravatar.cc/150?u=${encodeURIComponent(
      identifier
    )}`;
  }

  /* Already a complete URI */
  if (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('file://') ||
    avatar.startsWith('data:') ||
    avatar.startsWith('blob:')
  ) {
    return avatar;
  }

  /*
   * Convert Laravel relative storage URLs
   *
   * API:
   * http://192.168.1.229:8001/api/v1
   *
   * Backend:
   * http://192.168.1.229:8001
   */
  const serverBaseUrl =
    API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  /* /storage/profile_images/avatar.jpg */
  if (avatar.startsWith('/')) {
    return `${serverBaseUrl}${avatar}`;
  }

  /* storage/profile_images/avatar.jpg */
  if (avatar.startsWith('storage/')) {
    return `${serverBaseUrl}/${avatar}`;
  }

  /* profile_images/avatar.jpg */
  return `${serverBaseUrl}/storage/${avatar}`;
};

/* ─────────────────────────────────────────────
   MAP API USER → FRONTEND USER
───────────────────────────────────────────── */
function mapUser(apiUser = {}, token = null) {
  const profileImage =
    apiUser.profile_image ??
    apiUser.avatar ??
    apiUser.profileImage ??
    null;

  return {
    id: apiUser.id,

    name:
      apiUser.full_name ??
      apiUser.name ??
      apiUser.email ??
      'User',

    email: apiUser.email ?? null,

    role: apiUser.role ?? null,

    /*
     * Keep the original backend image if available.
     * getProfileAvatarUri() will normalize it when displayed.
     */
    avatar:
      profileImage ??
      `https://i.pravatar.cc/150?u=${encodeURIComponent(
        apiUser.email ?? apiUser.id ?? 'user'
      )}`,

    profile_image: profileImage,

    matricule:
      apiUser.employee_code ??
      apiUser.matricule ??
      null,

    department:
      apiUser.department ??
      null,

    position:
      apiUser.position ??
      null,

    phone:
      apiUser.phone ??
      null,

    token,
  };
}

/* ─────────────────────────────────────────────
   CLEAR AUTH STORAGE
───────────────────────────────────────────── */
async function clearStorage() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);
}

