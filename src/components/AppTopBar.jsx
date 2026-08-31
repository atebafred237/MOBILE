import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, LifeBuoy, LogOut, Settings, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

const AppTopBar = ({ settingsRoute = 'AdminSettings' }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const { adminNotifs, empNotifs, markAdminNotifRead, markEmpNotifRead } = useData();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const popupAnimation = useRef(new Animated.Value(0)).current;
  const isAttendance = route.name === 'AdminAttendance';
  const notifications = user?.role === 'admin' ? adminNotifs : empNotifs;
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const markNotificationRead = user?.role === 'admin' ? markAdminNotifRead : markEmpNotifRead;

  useEffect(() => {
    const popupVisible = notificationsVisible || profileMenuVisible;
    if (popupVisible) {
      popupAnimation.setValue(0);
      Animated.spring(popupAnimation, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220, mass: 0.7 }).start();
    }
  }, [notificationsVisible, profileMenuVisible, popupAnimation]);

  const popupStyle = { opacity: popupAnimation, transform: [{ scale: popupAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }, { translateY: popupAnimation.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] };

  const handleNavigate = (targetRoute, params) => {
    setProfileMenuVisible(false);
    setNotificationsVisible(false);
    // Use requestAnimationFrame or direct navigation instead of setTimeout 10ms
    requestAnimationFrame(() => {
      navigation.navigate(targetRoute, params);
    });
  };

  return (
    <View style={[styles.topBar, { height: 100 + insets.top, paddingTop: insets.top }, isDark && styles.darkTopBar, isAttendance && styles.attendanceTopBar]}>
      <Image
        source={require('../../assets/new logo transparent.png')}
        style={styles.logo}
        resizeMethod="resize"
        resizeMode="contain"
        accessibilityLabel="Presenza logo"
      />
      <View style={styles.headerTools}>
        <TouchableOpacity style={styles.notificationButton} onPress={() => { setNotificationsVisible(value => !value); setProfileMenuVisible(false); }} accessibilityLabel="Notifications">
          <Bell size={21} color={isDark ? colors.slate[100] : colors.slate[700]} />
          {unreadCount > 0 && <View style={styles.notificationBadge}><Text style={styles.notificationCount}>{unreadCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton} onPress={() => { setProfileMenuVisible(value => !value); setNotificationsVisible(false); }} accessibilityLabel="Open profile menu">
          <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=admin' }} style={styles.profileAvatar} />
        </TouchableOpacity>
      </View>
      {notificationsVisible && (
          <Modal transparent visible onRequestClose={() => setNotificationsVisible(false)}>
          <View style={styles.modalLayer}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setNotificationsVisible(false)} accessibilityLabel="Close notifications" />
            <Animated.View style={[styles.notificationsMenu, isDark && styles.darkMenu, popupStyle]}>
              <View style={styles.notificationsHeader}>
                <Text style={styles.notificationsTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => markNotificationRead('all')} accessibilityLabel="Mark all notifications as read">
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              </View>
              {notifications.length ? notifications.slice(0, 3).map(notification => (
                <TouchableOpacity key={notification.id} style={[styles.notificationItem, !notification.read && styles.unreadNotification]} onPress={() => { markNotificationRead(notification.id); handleNavigate(settingsRoute, { section: 'notifications', notification, notificationRequest: Date.now() }); }}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationType}>{notification.type}</Text>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )) : <Text style={styles.emptyNotifications}>No notifications</Text>}
              {notifications.length > 0 && <TouchableOpacity style={styles.viewAllButton} onPress={() => handleNavigate(settingsRoute, { section: 'notifications', notification: null, notificationListRequest: Date.now() })}><Text style={styles.viewAllText}>View all notifications</Text></TouchableOpacity>}
            </Animated.View>
          </View>
        </Modal>
      )}
      {profileMenuVisible && (
        <Modal transparent visible onRequestClose={() => setProfileMenuVisible(false)}>
          <View style={styles.modalLayer}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setProfileMenuVisible(false)} accessibilityLabel="Close profile menu" />
            <Animated.View style={[styles.profileMenu, isDark && styles.darkMenu, isAttendance && styles.attendanceProfileMenu, popupStyle]}>
          <View style={styles.profileMenuHeader}>
            <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=admin' }} style={styles.menuAvatar} />
            <View><Text style={styles.menuTitle}>System Administrator</Text><Text style={styles.menuEmail}>{user?.email || 'admin@example.com'}</Text></View>
          </View>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(user?.role === 'employee' ? 'EmployeeProfile' : settingsRoute, user?.role === 'admin' ? { section: 'account' } : undefined)}>
            <User size={18} color={colors.slate[600]} /><Text style={styles.menuItemText}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(settingsRoute, { resetRequest: Date.now() })}>
            <Settings size={18} color={colors.slate[600]} /><Text style={styles.menuItemText}>Account Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(settingsRoute, { section: 'support', resetRequest: Date.now() })}>
            <LifeBuoy size={18} color={colors.slate[600]} /><Text style={styles.menuItemText}>Support Center</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => { setProfileMenuVisible(false); setTimeout(logout, 10); }}>
            <LogOut size={18} color={colors.danger} /><Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate[200], zIndex: 20 },
  attendanceTopBar: {},
  darkTopBar: { backgroundColor: colors.slate[800], borderBottomColor: colors.slate[600] },
  logo: { width: 200, height: 48, resizeMode: 'contain' },
  headerTools: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notificationButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  notificationBadge: { position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' },
  notificationCount: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  modalLayer: { flex: 1 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.38)' },
  notificationsMenu: { position: 'absolute', zIndex: 30, top: 90, right: 62, width: 300, maxHeight: 360, backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.slate[200], paddingVertical: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 8 },
  darkMenu: { backgroundColor: colors.slate[800], borderColor: colors.slate[600] },
  notificationsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  notificationsTitle: { color: colors.slate[900], fontSize: 15, fontWeight: '700' },
  markAllText: { color: colors.pink[800], fontSize: 11, fontWeight: '600' },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  unreadNotification: { backgroundColor: colors.slate[50] },
  notificationContent: { flex: 1 },
  notificationType: { color: colors.pink[800], fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  notificationTitle: { color: colors.slate[800], fontSize: 13, fontWeight: '700', marginTop: 2 },
  notificationMessage: { color: colors.slate[500], fontSize: 11, lineHeight: 16, marginTop: 2 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, marginLeft: spacing.sm, marginTop: 4 },
  emptyNotifications: { color: colors.slate[500], fontSize: 13, padding: spacing.md, textAlign: 'center' },
  viewAllButton: { alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate[100] },
  viewAllText: { color: colors.pink[800], fontSize: 12, fontWeight: '700' },
  profileButton: { borderRadius: 20, borderWidth: 2, borderColor: colors.white },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.slate[200] },
  profileMenu: { position: 'absolute', zIndex: 30, top: 94, right: spacing.md, width: 250, backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.slate[200], paddingVertical: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 8 },
  attendanceProfileMenu: { top: 94 },
  profileMenuHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  menuAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.slate[200] },
  menuTitle: { fontSize: 14, fontWeight: '700', color: colors.slate[900] },
  menuEmail: { fontSize: 12, color: colors.slate[500], marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: colors.slate[200], marginVertical: spacing.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 11 },
  menuItemText: { fontSize: 14, color: colors.slate[700] },
  signOutText: { fontSize: 14, color: colors.danger, fontWeight: '600' },
});

export default AppTopBar;
