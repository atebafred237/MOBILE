import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Bot, Home, Users, Calendar, Settings as SettingsIcon, Building2 } from 'lucide-react-native';
import AppTopBar from '../components/AppTopBar';

// Placeholder Screens
import SignIn from '../pages/SignIn';
import ForgotPasswordEmail from '../pages/ForgotPasswordEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PasswordSuccess from '../pages/PasswordSuccess';
import ChangePassword from '../pages/ChangePassword';
import Onboarding from '../pages/Onboarding';
import OnboardingTwo from '../pages/OnboardingTwo';
import OnboardingThree from '../pages/OnboardingThree';
import EnvironmentSelection from '../pages/EnvironmentSelection';
import AccessOptions from '../pages/AccessOptions';
import PricingPlans from '../pages/PricingPlans';
import CompanySetup from '../pages/CompanySetup';
import AdminDashboard from '../pages/AdminDashboard';
import AdminAttendance from '../pages/AdminAttendance';
import AdminManagement from '../pages/AdminManagement';
import Settings from '../pages/Settings';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import EmployeeAttendance from '../pages/EmployeeAttendance';
import EmployeeProfile from '../pages/EmployeeProfile';
import KioskDashboard from '../pages/KioskDashboard';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const FloatingAiButton = ({ settingsRoute }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.floatingAiButton}
      onPress={() => navigation.navigate(settingsRoute, { section: 'support', resetRequest: Date.now() })}
      accessibilityLabel="Open AI assistance"
    >
      <Bot size={23} color="#ffffff" />
    </TouchableOpacity>
  );
};

const withAdminTopBar = Screen => props => (
  <View style={{ flex: 1 }}>
    <AppTopBar settingsRoute="AdminSettings" />
    <Screen {...props} />
    <FloatingAiButton settingsRoute="AdminSettings" />
  </View>
);

const withEmployeeTopBar = Screen => props => (
  <View style={{ flex: 1 }}>
    <AppTopBar settingsRoute="EmployeeSettings" />
    <Screen {...props} />
    <FloatingAiButton settingsRoute="EmployeeSettings" />
  </View>
);

const AdminDashboardWithTopBar = withAdminTopBar(AdminDashboard);
const AdminAttendanceWithTopBar = withAdminTopBar(AdminAttendance);
const AdminManagementWithTopBar = withAdminTopBar(AdminManagement);
const AdminSettingsWithTopBar = withAdminTopBar(Settings);
const EmployeeDashboardWithTopBar = withEmployeeTopBar(EmployeeDashboard);
const EmployeeAttendanceWithTopBar = withEmployeeTopBar(EmployeeAttendance);
const EmployeeProfileWithTopBar = withEmployeeTopBar(EmployeeProfile);
const EmployeeSettingsWithTopBar = withEmployeeTopBar(Settings);

const AdminTabs = () => (
  <AdminTabsContent />
);

const AdminTabsContent = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
    screenOptions={{
      headerShown: false,
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: '#0f172a',
      tabBarActiveTintColor: '#9d174d', // pink-800
      tabBarInactiveTintColor: isDark ? '#cbd5e1' : '#64748b',
      tabBarStyle: { borderTopWidth: 1, borderTopColor: isDark ? '#475569' : '#e2e8f0', backgroundColor: isDark ? '#1e293b' : '#fff' },
    }}
  >
    <Tab.Screen 
      name="AdminDashboard" 
      component={AdminDashboardWithTopBar} 
      options={{ 
        title: t('dashboard'),
        tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} /> 
      }} 
    />
    <Tab.Screen 
      name="AdminAttendance" 
      component={AdminAttendanceWithTopBar} 
      options={{ 
        title: t('attendance'),
        tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> 
      }} 
    />
    <Tab.Screen
      name="AdminManagement"
      component={AdminManagementWithTopBar}
      options={{
        title: 'Manage',
        tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} strokeWidth={2} />
      }}
    />
    <Tab.Screen 
      name="AdminSettings" 
      component={AdminSettingsWithTopBar} 
      options={{ 
        title: t('settingsTab'),
        tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} strokeWidth={2} /> 
      }} 
    />
    </Tab.Navigator>
  );
};

const EmployeeTabs = () => <EmployeeTabsContent />;

const EmployeeTabsContent = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
    screenOptions={{
      headerShown: false,
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: '#0f172a',
      tabBarActiveTintColor: '#9d174d', // pink-800
      tabBarInactiveTintColor: isDark ? '#cbd5e1' : '#64748b',
      tabBarStyle: { borderTopWidth: 1, borderTopColor: isDark ? '#475569' : '#e2e8f0', backgroundColor: isDark ? '#1e293b' : '#fff' },
    }}
  >
    <Tab.Screen 
      name="EmployeeDashboard" 
      component={EmployeeDashboardWithTopBar} 
      options={{ 
        title: t('dashboard'),
        tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} /> 
      }} 
    />
    <Tab.Screen 
      name="EmployeeAttendance" 
      component={EmployeeAttendanceWithTopBar} 
      options={{ 
        title: t('attendance'),
        tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> 
      }} 
    />
    <Tab.Screen 
      name="EmployeeProfile" 
      component={EmployeeProfileWithTopBar} 
      options={{ 
        title: t('profileTab'),
        tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} /> 
      }} 
    />
    <Tab.Screen 
      name="EmployeeSettings" 
      component={EmployeeSettingsWithTopBar} 
      options={{ 
        title: t('settingsTab'),
        tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} strokeWidth={2} /> 
      }} 
    />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading, hasOnboarded, environment } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      SplashScreen.hideAsync();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Image
          source={require('../../assets/new logo transparent.png')}
          style={{ width: 220, height: 60 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={!user ? (environment ? 'SignIn' : hasOnboarded ? 'EnvironmentSelection' : 'Onboarding') : undefined}
      >
        {!user ? (
          <>
            <Stack.Group screenOptions={{ animation: 'none', gestureEnabled: true }}>
              <Stack.Screen name="Onboarding" component={Onboarding} />
              <Stack.Screen name="OnboardingTwo" component={OnboardingTwo} />
              <Stack.Screen name="OnboardingThree" component={OnboardingThree} />
              <Stack.Screen name="EnvironmentSelection" component={EnvironmentSelection} />
            </Stack.Group>
            <Stack.Screen name="AccessOptions" component={AccessOptions} />
            <Stack.Screen name="PricingPlans" component={PricingPlans} />
            <Stack.Screen name="CompanySetup" component={CompanySetup} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmail} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="PasswordSuccess" component={PasswordSuccess} />
          </>
        ) : user.mustChangePassword ? (
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminRoot" component={AdminTabs} />
        ) : user.role === 'kiosk' ? (
          <Stack.Screen name="KioskRoot" component={KioskDashboard} />
        ) : (
          <Stack.Screen name="EmployeeRoot" component={EmployeeTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  floatingAiButton: {
    position: 'absolute',
    right: 20,
    bottom: 82,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9d174d',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 7,
    zIndex: 50,
  },
});

export default AppNavigator;
