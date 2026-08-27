import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('presencehub_user');
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const savedPic = await AsyncStorage.getItem('profile_picture');
    let loggedInUser;

    if (email === 'admin@example.com') {
      loggedInUser = {
        name: 'System Administrator',
        email,
        role: 'admin',
        avatar: savedPic || 'https://i.pravatar.cc/150?u=admin'
      };
    } else if (email === 'employee@example.com') {
      loggedInUser = {
        name: 'Sarah Jenkins',
        email,
        role: 'employee',
        matricule: 'EMP-0042',
        department: 'Engineering',
        position: 'Senior Developer',
        avatar: savedPic || 'https://i.pravatar.cc/150?u=sarah'
      };
    } else {
      loggedInUser = {
        name: email.includes('admin') ? 'Administrator' : 'Test Employee',
        email,
        role: email.includes('admin') ? 'admin' : 'employee',
        matricule: 'EMP-0001',
        department: 'General',
        position: 'Staff',
        avatar: savedPic || `https://i.pravatar.cc/150?u=${email}`
      };
    }
    
    setUser(loggedInUser);
    await AsyncStorage.setItem('presencehub_user', JSON.stringify(loggedInUser));
    return { success: true, role: loggedInUser.role };
  };

  const updateProfilePicture = async (base64Image) => {
    await AsyncStorage.setItem('profile_picture', base64Image);
    if (user) {
      const updatedUser = { ...user, avatar: base64Image };
      setUser(updatedUser);
      await AsyncStorage.setItem('presencehub_user', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = async (changes) => {
    if (!user) return;
    const updatedUser = { ...user, ...changes };
    setUser(updatedUser);
    await AsyncStorage.setItem('presencehub_user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('presencehub_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfilePicture, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
