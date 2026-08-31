import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Home, Users, Calendar, Settings as SettingsIcon, Bell } from 'lucide-react-native';
import AppTopBar from '../components/AppTopBar';

// Placeholder Screens
import SignIn from '../pages/SignIn';
import ForgotPasswordEmail from '../pages/ForgotPasswordEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PasswordSuccess from '../pages/PasswordSuccess';
import Onboarding from '../pages/Onboarding';
import OnboardingTwo from '../pages/OnboardingTwo';
import OnboardingThree from '../pages/OnboardingThree';
import AdminDashboard from '../pages/AdminDashboard';
import AdminEmployees from '../pages/AdminEmployees';
import AdminAttendance from '../pages/AdminAttendance';
import Settings from '../pages/Settings';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import EmployeeAttendance from '../pages/EmployeeAttendance';
import EmployeeProfile from '../pages/EmployeeProfile';
import KioskDashboard from '../pages/KioskDashboard';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const withAdminTopBar = Screen => props => (
  <View style={{ flex: 1 }}>
    <AppTopBar settingsRoute="AdminSettings" />
    <Screen {...props} />
  </View>
);

const withEmployeeTopBar = Screen => props => (
  <View style={{ flex: 1 }}>
    <AppTopBar settingsRoute="EmployeeSettings" />
    <Screen {...props} />
  </View>
);

const AdminDashboardWithTopBar = withAdminTopBar(AdminDashboard);
const AdminEmployeesWithTopBar = withAdminTopBar(AdminEmployees);
const AdminAttendanceWithTopBar = withAdminTopBar(AdminAttendance);
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
      name="AdminEmployees" 
      component={AdminEmployeesWithTopBar} 
      options={{ 
        title: t('employees'),
        tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} /> 
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
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      SplashScreen.hideAsync();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Group screenOptions={{ animation: 'none', gestureEnabled: true }}>
              <Stack.Screen name="Onboarding" component={Onboarding} />
              <Stack.Screen name="OnboardingTwo" component={OnboardingTwo} />
              <Stack.Screen name="OnboardingThree" component={OnboardingThree} />
            </Stack.Group>
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmail} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="PasswordSuccess" component={PasswordSuccess} />
          </>
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

export default AppNavigator;
