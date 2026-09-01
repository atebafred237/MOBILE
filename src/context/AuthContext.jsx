import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

const TOKEN_KEY = 'presencehub_token';
const USER_KEY  = 'Presenza_user';
const ONBOARDED_KEY = 'Presenza_onboarded';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  /* ─── On mount: restore token and verify with API ─── */
  useEffect(() => {
    const restore = async () => {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
        if (onboarded) setHasOnboarded(true);

        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser  = await AsyncStorage.getItem(USER_KEY);

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
              const u = mapUser(json.data ?? json, savedToken);
              setToken(savedToken);
              setUser(u);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
            } else {
              // Token invalid — clear everything
              await clearStorage();
            }
          } catch (e) {
            // Network error — use cached user so app still opens offline
            console.warn('Could not verify token with API, using cached user', e);
            if (savedUser) {
              setToken(savedToken);
              setUser(JSON.parse(savedUser));
            }
          }
        }
      } catch (e) {
        console.error('Auth restore error', e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const completeOnboarding = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  };

  /* ─── Login ─── */
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.message || 'Login failed' };
      }

      const apiToken = json.access_token;
      const u = mapUser(json.user, apiToken);

      setToken(apiToken);
      setUser(u);
      await AsyncStorage.setItem(TOKEN_KEY, apiToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      await completeOnboarding();

      return { success: true, role: u.role };
    } catch (e) {
      console.error('Login error', e);
      return { success: false, error: 'Network error. Check your connection.' };
    }
  };

  /* ─── Logout ─── */
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch (e) {
      console.warn('Logout API call failed', e);
    } finally {
      setUser(null);
      setToken(null);
      await clearStorage();
    }
  };

  /* ─── Profile helpers ─── */
  const updateProfilePicture = async (uri) => {
    if (!user || !token) return;
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type });

      const res = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const mapped = mapUser(json.data, token);
        setUser(mapped);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(mapped));
      } else {
        console.warn('Avatar update failed', await res.text());
        fallbackAvatarUpdate(uri);
      }
    } catch (e) {
      console.warn('Avatar upload error', e);
      fallbackAvatarUpdate(uri);
    }
  };

  const fallbackAvatarUpdate = async (uri) => {
    const updated = { ...user, avatar: uri };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const updateProfile = async (changes) => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: JSON.stringify(changes)
      });
      if (res.ok) {
        const json = await res.json();
        const mapped = mapUser(json.data, token);
        setUser(mapped);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(mapped));
      } else {
        console.warn('Profile update failed', await res.text());
        // Fallback to local update
        const updated = { ...user, ...changes };
        setUser(updated);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Profile update error', e);
      const updated = { ...user, ...changes };
      setUser(updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfilePicture, updateProfile, loading, hasOnboarded, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

/* ─── Helpers ─── */
function mapUser(apiUser, token) {
  return {
    id:         apiUser.id,
    name:       apiUser.full_name ?? apiUser.name ?? apiUser.email,
    email:      apiUser.email,
    role:       apiUser.role,          // string: 'admin' | 'employee' | 'supervisor'
    avatar:     apiUser.profile_image ?? `https://i.pravatar.cc/150?u=${apiUser.email}`,
    matricule:  apiUser.employee_code ?? null,
    department: apiUser.department ?? null,
    position:   apiUser.position ?? null,
    phone:      apiUser.phone ?? null,
    token,
  };
}

async function clearStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
