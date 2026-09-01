import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, SERVER_BASE_URL } from '../config';

const AuthContext = createContext();
const TOKEN_KEY = 'presencehub_token';
const USER_KEY = 'Presenza_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (!savedToken) return;
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: authHeaders(savedToken) });
          if (!response.ok) return clearStorage();
          const json = await response.json();
          const restoredUser = mapUser(json.data ?? json, savedToken);
          setToken(savedToken);
          setUser(restoredUser);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(restoredUser));
        } catch (error) {
          console.warn('Could not verify token with API, using cached user', error);
          if (savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Auth restore error', error);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email, password }) });
      const json = await response.json();
      if (!response.ok) return { success: false, error: json.message || 'Login failed' };
      const nextToken = json.access_token;
      const nextUser = mapUser(json.user, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      await AsyncStorage.setItem(TOKEN_KEY, nextToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return { success: true, role: nextUser.role };
    } catch (error) {
      console.error('Login error', error);
      return { success: false, error: 'Network error. Check your connection.' };
    }
  };

  const logout = async () => {
    try {
      if (token) await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: authHeaders(token) });
    } catch (error) {
      console.warn('Logout API call failed', error);
    } finally {
      setUser(null);
      setToken(null);
      await clearStorage();
    }
  };

  const refreshUserFromServer = async () => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, { headers: authHeaders(token) });
      if (!response.ok) return null;
      const json = await response.json();
      const refreshedUser = mapUser(json.data ?? json, token);
      setUser(refreshedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
      return refreshedUser;
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
      return null;
    }
  };

  const updateProfilePicture = async uri => {
    if (!user || !token) return { success: false, error: 'No user or token' };
    const optimisticUser = { ...user, avatar: uri, profile_image: uri, reference_photo_path: uri };
    setUser(optimisticUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(optimisticUser));
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const extension = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() || 'jpg';
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        formData.append('avatar', blob, filename.includes('.') ? filename : `${filename}.jpg`);
      } else {
        const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
        formData.append('avatar', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: filename.includes('.') ? filename : `${filename}.jpg`, type });
      }
      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, { method: 'POST', headers: authHeaders(token), body: formData });
      if (!response.ok) return { success: false, error: await response.text() };
      const refreshedUser = await refreshUserFromServer();
      if (!refreshedUser) return { success: false, error: 'Upload succeeded but user data could not be refreshed' };
      return { success: true, avatar: getProfileAvatarUri(refreshedUser, refreshedUser.name || 'User') };
    } catch (error) {
      console.warn('Avatar upload error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async changes => {
    if (!user || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/profile`, { method: 'PUT', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
      if (!response.ok) throw new Error(await response.text());
      const json = await response.json();
      const updatedUser = mapUser(json.data ?? json, token);
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.warn('Profile update error', error);
      const updatedUser = { ...user, ...changes };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  return <AuthContext.Provider value={{ user, token, login, logout, updateProfilePicture, updateProfile, refreshUserFromServer, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

const authHeaders = authToken => ({ Authorization: `Bearer ${authToken}`, Accept: 'application/json' });

function mapUser(apiUser, token) {
  const name = apiUser.full_name ?? apiUser.name ?? apiUser.email ?? 'User';
  const avatar = resolveAvatarValue(apiUser, null);
  return { id: apiUser.id, name, email: apiUser.email, role: apiUser.role, avatar: avatar || fallbackAvatar(name), profile_image: avatar, reference_photo_path: avatar, matricule: apiUser.employee_code ?? null, department: apiUser.department ?? null, position: apiUser.position ?? null, phone: apiUser.phone ?? null, token };
}

export function getProfileAvatarUri(user, fallbackName = 'User') {
  const value = user?.reference_photo_path ?? user?.profile_image ?? user?.avatar;
  return value ? normalizeAvatarUrl(value) : fallbackAvatar(fallbackName);
}

function resolveAvatarValue(apiUser, fallbackUri = null) {
  const value = apiUser?.reference_photo_path ?? apiUser?.profile_image ?? apiUser?.avatar ?? fallbackUri;
  return value ? normalizeAvatarUrl(value) : null;
}

function normalizeAvatarUrl(value) {
  if (value.startsWith('blob:') || value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${SERVER_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function fallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=fff&size=150`;
}

async function clearStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
