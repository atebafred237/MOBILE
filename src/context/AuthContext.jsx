import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

const TOKEN_KEY = 'presencehub_token';
const USER_KEY  = 'Presenza_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  /* ─── On mount: restore token and verify with API ─── */
  useEffect(() => {
    const restore = async () => {
      try {
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
  const updateProfilePicture = async (base64Image) => {
    await AsyncStorage.setItem('profile_picture', base64Image);
    if (user) {
      const updated = { ...user, avatar: base64Image };
      setUser(updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  };

  const updateProfile = async (changes) => {
    if (!user) return;
    const updated = { ...user, ...changes };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfilePicture, updateProfile, loading }}>
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
    token,
  };
}

async function clearStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
