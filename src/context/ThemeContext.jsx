import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  theme: 'Light',
  setTheme: async () => {},
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('Light');

  useEffect(() => {
    AsyncStorage.getItem('presencehub_theme').then(savedTheme => {
      if (savedTheme === 'Light' || savedTheme === 'Dark' || savedTheme === 'System') setThemeState(savedTheme);
    });
  }, []);

  const setTheme = async value => {
    setThemeState(value);
    await AsyncStorage.setItem('presencehub_theme', value);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'Dark' }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
