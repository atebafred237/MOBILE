import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    Asset.loadAsync([
      require('./assets/scan1-transparent.png'),
      require('./assets/scan2-onboarding.png'),
      require('./assets/scan3.png'),
    ]).finally(async () => {
      setAssetsReady(true);
      await SplashScreen.hideAsync();
    });
  }, []);

  if (!assetsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AppNavigator />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
