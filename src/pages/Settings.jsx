import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, ArrowLeft, Bell, Bot, CheckCircle2, ChevronRight, FileText, Languages, LifeBuoy, LogOut, Moon, RefreshCw, Search, Send, Server, ShieldCheck, ShieldHalf, Sun, Trash2, UserRound } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const SETTINGS_OPTIONS = [
	{ key: 'reports', title: 'Reports', description: 'Review, export, and manage attendance reports.', icon: FileText, color: colors.pink[800], background: colors.pink[50] },
	{ key: 'notifications', title: 'Notifications', description: 'Control alerts and attendance activity updates.', icon: Bell, color: colors.orange[600], background: colors.orange[50] },
	{ key: 'account', title: 'Account', description: 'Manage your profile, login, and account preferences.', icon: UserRound, color: colors.primary[600], background: colors.primary[50] },
	{ key: 'language', title: 'Language', description: 'Choose the language used throughout the app.', icon: Languages, color: colors.pink[800], background: colors.pink[50] },
	{ key: 'theme', title: 'Theme', description: 'Choose how Presenza looks on your device.', icon: Sun, color: colors.orange[600], background: colors.orange[50] },
	{ key: 'support', title: 'Support Center', description: 'Find help and contact the Presenza support team.', icon: LifeBuoy, color: colors.green[600], background: colors.green[50] },
	{ key: 'api-health', title: 'API Health', description: 'Monitor API availability and service response status.', icon: Activity, color: colors.orange[600], background: colors.orange[50] },
	{ key: 'system-health', title: 'System Health', description: 'View current platform and infrastructure health.', icon: Server, color: colors.green[600], background: colors.green[50] },
	{ key: 'security-standards', title: 'Security Standards', description: 'Review security controls and operational standards.', icon: ShieldCheck, color: colors.primary[600], background: colors.primary[50] },
	{ key: 'privacy-policy', title: 'Privacy & Policy', description: 'Read privacy practices and platform policies.', icon: ShieldHalf, color: colors.slate[700], background: colors.slate[100] },
];

const getRelativeTime = dateValue => {
	const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
	if (seconds < 60) return 'Just now';
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	return `${Math.floor(seconds / 86400)}d ago`;
};

const SUPPORT_TASKS = [
	'Open my attendance records',
	'Show unread notifications',
	'Find a downloaded report',
	'Help me add an employee',
];

const getSupportReply = question => {
	const text = question.toLowerCase();
	if (text.includes('attendance')) return 'I can help you review attendance records. Open the Attendance tab to filter by status, weekday, employee, date, or location.';
	if (text.includes('notification')) return 'I can help you review notifications. Open Settings, choose Notifications, and tap any item to read its complete message.';
	if (text.includes('report')) return 'Your downloaded reports are in Settings > Reports. Select a report to view its content or use the delete controls to manage it.';
	if (text.includes('employee')) return 'To add an employee, open the Employees tab and select Add New Employee. You can then manage roles, contact details, and profiles.';
	return 'I can help with attendance records, notifications, downloaded reports, or employee management. Choose a task above or ask me about one of these areas.';
};

const Settings = () => {
	const { user, logout, updateProfile } = useAuth();
	const { language, setLanguage: saveLanguage, t } = useLanguage();
	const { isDark } = useTheme();
	const { theme, setTheme } = useTheme();
	const { adminNotifs, empNotifs, markAdminNotifRead, markEmpNotifRead, reports, deleteReport, deleteAllReports, deleteNotification } = useData();
	const route = useRoute();
	const navigation = useNavigation();
	const [selectedKey, setSelectedKey] = useState(route.params?.section || null);
	const [selectedNotification, setSelectedNotification] = useState(route.params?.notification || null);
	const [notificationMenuId, setNotificationMenuId] = useState(null);
	const [notificationConfirmAction, setNotificationConfirmAction] = useState(null);
	const [selectedNotificationMenu, setSelectedNotificationMenu] = useState(null);
	const [selectedReport, setSelectedReport] = useState(null);
	const [notificationSearch, setNotificationSearch] = useState('');
	const [selectedStandard, setSelectedStandard] = useState(null);
	const [supportInput, setSupportInput] = useState('');
	const [supportMessages, setSupportMessages] = useState([{ id: 'welcome', role: 'assistant', text: 'Hi! I can help you complete tasks in Presenza. What would you like to do?' }]);
	const [accountEmail, setAccountEmail] = useState(user?.email || '');
	const [accountPhone, setAccountPhone] = useState(user?.phone || '');
	const [accountSaved, setAccountSaved] = useState(false);
	const screenAnimation = useRef(new Animated.Value(0)).current;
	const selectedOption = SETTINGS_OPTIONS.find(option => option.key === selectedKey);
	const notifications = user?.role === 'admin' ? adminNotifs : empNotifs;
	const markNotificationRead = user?.role === 'admin' ? markAdminNotifRead : markEmpNotifRead;
	useEffect(() => {
		const unsubscribe = navigation.addListener('tabPress', (e) => {
			setSelectedKey(null);
			setSelectedNotification(null);
			setSelectedReport(null);
		});
		return unsubscribe;
	}, [navigation]);
	useEffect(() => {
		screenAnimation.setValue(0);
		Animated.timing(screenAnimation, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
	}, [selectedKey, selectedNotification, selectedReport, screenAnimation]);

	const screenStyle = { opacity: screenAnimation, transform: [{ translateY: screenAnimation.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] };

	useEffect(() => {
		if (route.params?.section === 'notifications') setSelectedNotification(null);
		if (route.params?.notification) setSelectedNotification(route.params.notification);
		if (route.params?.section) setSelectedKey(route.params.section);
	}, [route.params?.notification, route.params?.section, route.params?.notificationRequest, route.params?.notificationListRequest]);

	if (selectedNotification) {
		return (
			<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
				<TouchableOpacity style={styles.backButton} onPress={() => setSelectedNotification(null)}>
					<ArrowLeft size={18} color={colors.slate[700]} />
					<Text style={styles.backText}>Notifications</Text>
				</TouchableOpacity>
				<View style={styles.detailCard}>
					<View style={[styles.detailIcon, { backgroundColor: colors.orange[50] }]}><Bell size={28} color={colors.orange[600]} /></View>
					<Text style={styles.detailTitle}>{selectedNotification.title}</Text>
					<Text style={styles.notificationDetailType}>{selectedNotification.type}</Text>
					<Text style={styles.notificationDetailMessage}>{selectedNotification.message}</Text>
					<Text style={styles.notificationDetailDate}>{new Date(selectedNotification.date).toLocaleString()}</Text>
				</View>
			</Animated.ScrollView>
		);
	}

	if (selectedReport) {
		return (
			<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
				<TouchableOpacity style={styles.backButton} onPress={() => setSelectedReport(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Reports</Text></TouchableOpacity>
				<View style={styles.detailCard}>
					<View style={[styles.detailIcon, { backgroundColor: colors.pink[50] }]}><FileText size={28} color={colors.pink[800]} /></View>
					<Text style={styles.detailTitle}>{selectedReport.name}</Text>
					<Text style={styles.reportDetailMeta}>{selectedReport.format} Â· {selectedReport.size} Â· {getRelativeTime(selectedReport.date)}</Text>
					<Text style={styles.reportDetailContent}>{selectedReport.content}</Text>
					<View style={styles.detailStatus}><Text style={styles.detailStatusText}>Report content</Text><Text style={styles.detailStatusMuted}>Downloaded {new Date(selectedReport.date).toLocaleString()}</Text></View>
				</View>
			</Animated.ScrollView>
		);
	}

	if (selectedOption) {
		if (selectedOption.key === 'support') {
			const submitSupportTask = task => {
				const question = task.trim();
				if (!question) return;
				setSupportMessages(current => [...current, { id: `${Date.now()}-user`, role: 'user', text: question }, { id: `${Date.now()}-assistant`, role: 'assistant', text: getSupportReply(question) }]);
				setSupportInput('');
			};
			return (
				<View style={styles.supportScreen}>
					<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.supportContent}>
						<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
						<View style={styles.chatHeader}><View style={styles.chatBotIcon}><Bot size={22} color={colors.green[600]} /></View><View><Text style={styles.detailTitle}>Support Center</Text><Text style={styles.chatStatus}>Presenza task assistant</Text></View></View>
						<View style={styles.chatCard}>
							{supportMessages.map(message => (
								<View key={message.id} style={[styles.chatBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.chatBubbleText, message.role === 'user' && styles.userBubbleText]}>{message.text}</Text></View>
							))}
						</View>
						<Text style={styles.taskHeading}>Tasks you can ask me to perform</Text>
						<View style={styles.taskList}>{SUPPORT_TASKS.map(task => <TouchableOpacity key={task} style={styles.taskChip} onPress={() => submitSupportTask(task)}><Text style={styles.taskChipText}>{task}</Text></TouchableOpacity>)}</View>
					</Animated.ScrollView>
					<View style={styles.chatComposer}><TextInput style={styles.chatInput} value={supportInput} onChangeText={setSupportInput} placeholder="Ask about an app task..." placeholderTextColor={colors.slate[400]} onSubmitEditing={() => submitSupportTask(supportInput)} returnKeyType="send" /><TouchableOpacity style={styles.sendButton} onPress={() => submitSupportTask(supportInput)} accessibilityLabel="Send support question"><Send size={18} color={colors.white} /></TouchableOpacity></View>
				</View>
			);
		}
		if (selectedOption.key === 'reports') {
			return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={styles.reportsHeader}>
						<View><Text style={styles.detailTitle}>Downloaded Reports</Text><Text style={styles.notificationCountText}>{reports.length} saved report{reports.length === 1 ? '' : 's'}</Text></View>
						{reports.length > 0 && <TouchableOpacity onPress={() => Alert.alert('Delete all reports', 'Remove all downloaded reports?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete all', style: 'destructive', onPress: deleteAllReports }])} accessibilityLabel="Delete all reports"><Trash2 size={19} color={colors.danger} /></TouchableOpacity>}
					</View>
					<View style={styles.reportList}>
						{reports.map(report => (
							<View key={report.id} style={styles.reportRow}>
								<View style={styles.reportIcon}><FileText size={20} color={colors.pink[800]} /></View>
								<TouchableOpacity style={styles.reportCopy} onPress={() => setSelectedReport(report)} accessibilityLabel={`Open ${report.name}`}><Text style={styles.reportName}>{report.name}</Text><Text style={styles.reportMeta}>{report.format} Â· {report.size} Â· {getRelativeTime(report.date)}</Text></TouchableOpacity>
								<TouchableOpacity onPress={() => deleteReport(report.id)} accessibilityLabel={`Delete ${report.name}`}><Trash2 size={18} color={colors.danger} /></TouchableOpacity>
							</View>
						))}
						{!reports.length && <Text style={styles.emptyNotifications}>No downloaded reports</Text>}
					</View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'notifications') {
			const unreadCount = notifications.filter(notification => !notification.read).length;
			const query = notificationSearch.trim().toLowerCase();
			const visibleNotifications = notifications.filter(notification => !query || [notification.title, notification.message, notification.type].some(value => value.toLowerCase().includes(query)));
			const handleNotificationAction = (action, notification) => {
				setNotificationMenuId(null);
				setNotificationConfirmAction({ action, notification });
			};
			return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}>
						<ArrowLeft size={18} color={colors.slate[700]} />
						<Text style={styles.backText}>Settings</Text>
					</TouchableOpacity>
					<View style={styles.notificationsPageHeader}>
						<View><Text style={styles.detailTitle}>Notifications</Text><Text style={styles.notificationCountText}>{notifications.length} total Â· {unreadCount} unread</Text></View>
						<TouchableOpacity onPress={() => markNotificationRead('all')}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>
					</View>
					<View style={styles.notificationSearch}>
						<Search size={17} color={colors.slate[400]} />
						<TextInput style={styles.notificationSearchInput} value={notificationSearch} onChangeText={setNotificationSearch} placeholder="Search notifications" placeholderTextColor={colors.slate[400]} autoCapitalize="none" />
					</View>
					<View style={styles.notificationList}>
						{visibleNotifications.map(notification => (
							<View key={notification.id} style={[styles.settingsNotificationRow, !notification.read && styles.settingsUnreadRow]}>
								<TouchableOpacity style={styles.settingsNotificationInner} onPress={() => { markNotificationRead(notification.id); setSelectedNotification(notification); setNotificationMenuId(null); }}>
									<View style={styles.settingsNotificationIcon}><Bell size={18} color={colors.orange[600]} /></View>
									<View style={styles.settingsNotificationCopy}><View style={styles.settingsNotificationTitleRow}><Text style={styles.settingsNotificationTitle}>{notification.title}</Text>{!notification.read && <View style={styles.settingsUnreadDot} />}</View><Text style={styles.settingsNotificationMessage} numberOfLines={2}>{notification.message}</Text><Text style={styles.settingsNotificationTime}>{notification.type} Â· {getRelativeTime(notification.date)}</Text></View>
								</TouchableOpacity>
								<TouchableOpacity style={styles.notificationMenuButton} onPress={() => setNotificationMenuId(notificationMenuId === notification.id ? null : notification.id)} accessibilityLabel={`More options for ${notification.title}`}>
									<View style={styles.notificationMenuRow}>
										<View style={styles.notificationMenuDot} />
										<View style={styles.notificationMenuDot} />
										<View style={styles.notificationMenuDot} />
									</View>
								</TouchableOpacity>
								<Modal visible={notificationMenuId === notification.id} transparent={true} animationType="none" onRequestClose={() => setNotificationMenuId(null)}>
									<TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setNotificationMenuId(null)}>
										<View style={styles.actionSheet}>
											<TouchableOpacity style={[styles.actionSheetRow, { borderTopLeftRadius: 12, borderTopRightRadius: 12 }]} onPress={() => handleNotificationAction('see-more', notification)}>
												<Text style={styles.actionSheetText}>See more</Text>
											</TouchableOpacity>
											<TouchableOpacity style={styles.actionSheetRow} onPress={() => handleNotificationAction('see-less', notification)}>
												<Text style={styles.actionSheetText}>See less</Text>
											</TouchableOpacity>
											<TouchableOpacity style={[styles.actionSheetRow, styles.actionSheetDelete]} onPress={() => handleNotificationAction('delete', notification)}>
												<Text style={[styles.actionSheetText, styles.actionSheetDeleteText]}>Delete</Text>
											</TouchableOpacity>
											<View style={styles.actionSheetCancelSpacer} />
											<TouchableOpacity style={styles.actionSheetCancel} onPress={() => setNotificationMenuId(null)}>
												<Text style={styles.actionSheetCancelText}>Cancel</Text>
											</TouchableOpacity>
										</View>
									</TouchableOpacity>
								</Modal>
							</View>
						))}
						{!visibleNotifications.length && <Text style={styles.emptyNotifications}>No matching notifications</Text>}
					</View>
					<Modal visible={!!notificationConfirmAction} transparent={true} animationType="none" onRequestClose={() => setNotificationConfirmAction(null)}>
						<View style={styles.modalBackdropCentered}>
							<View style={styles.confirmDialogCard}>
								<Text style={styles.confirmDialogTitle}>
									{notificationConfirmAction?.action === 'delete' ? 'Delete notification' : 'Confirm Action'}
								</Text>
								<Text style={styles.confirmDialogMessage}>
									{notificationConfirmAction?.action === 'delete' ? 'Remove this notification?' : `Do you want to see ${notificationConfirmAction?.action === 'see-more' ? 'more' : 'fewer'} notifications of type: ${notificationConfirmAction?.notification?.type}?`}
								</Text>
								<View style={styles.confirmDialogActions}>
									<TouchableOpacity style={styles.confirmDialogButtonCancel} onPress={() => setNotificationConfirmAction(null)}>
										<Text style={styles.confirmDialogButtonCancelText}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity style={[styles.confirmDialogButtonConfirm, notificationConfirmAction?.action === 'delete' && styles.confirmDialogButtonDanger]} onPress={() => {
										if (notificationConfirmAction?.action === 'delete') {
											deleteNotification(notificationConfirmAction.notification.id, user?.role === 'admin' ? 'admin' : 'employee');
										}
										setNotificationConfirmAction(null);
									}}>
										<Text style={[styles.confirmDialogButtonConfirmText, notificationConfirmAction?.action === 'delete' && styles.confirmDialogButtonDangerText]}>
											{notificationConfirmAction?.action === 'delete' ? 'Delete' : 'Yes'}
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</Modal>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'account') {
			const saveAccount = async () => {
				await updateProfile({ email: accountEmail.trim(), phone: accountPhone.trim() });
				setAccountSaved(true);
			};
			return (
				<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={styles.accountCard}>
						<View style={styles.accountAvatarRing}><UserRound size={38} color={colors.primary[600]} /></View>
						<Text style={styles.accountName}>{user?.name || 'Account holder'}</Text>
						<Text style={styles.accountRole}>{user?.role === 'admin' ? 'Administrator' : 'Employee'}</Text>
						<View style={styles.accountForm}>
							<Text style={styles.accountLabel}>Email address</Text>
							<TextInput style={styles.accountInput} value={accountEmail} onChangeText={value => { setAccountEmail(value); setAccountSaved(false); }} autoCapitalize="none" keyboardType="email-address" />
							<Text style={styles.accountLabel}>Phone number</Text>
							<TextInput style={styles.accountInput} value={accountPhone} onChangeText={value => { setAccountPhone(value); setAccountSaved(false); }} keyboardType="phone-pad" />
							<TouchableOpacity style={styles.saveAccountButton} onPress={saveAccount} accessibilityRole="button"><Text style={styles.saveAccountText}>Save changes</Text></TouchableOpacity>
							{accountSaved && <Text style={styles.accountSuccess}>Account details saved successfully.</Text>}
						</View>
						<View style={styles.accountMeta}><Text style={styles.accountMetaLabel}>Employee ID</Text><Text style={styles.accountMetaValue}>{user?.matricule || 'ADMIN-0001'}</Text></View>
						<View style={styles.accountMeta}><Text style={styles.accountMetaLabel}>Access level</Text><Text style={styles.accountMetaValue}>{user?.role === 'admin' ? 'Administrator' : 'Standard employee'}</Text></View>
					</View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'system-health') {
			const services = [
				['Attendance services', 'Operational', '42 ms'],
				['Authentication', 'Operational', '38 ms'],
				['Data storage', 'Operational', '51 ms'],
				['Notification delivery', 'Operational', '46 ms'],
			];
			return (
				<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={styles.healthHero}>
						<View style={styles.healthIcon}><CheckCircle2 size={30} color={colors.green[600]} /></View>
						<View style={styles.healthHeroCopy}><Text style={styles.healthTitle}>All systems operational</Text><Text style={styles.healthSubtitle}>Presenza services are running normally.</Text></View>
					</View>
					<View style={styles.healthCard}>
						<View style={styles.healthCardHeader}><Text style={styles.healthCardTitle}>Service status</Text><TouchableOpacity style={styles.refreshButton} onPress={() => setSelectedKey('system-health')} accessibilityRole="button" accessibilityLabel="Refresh system health"><RefreshCw size={17} color={colors.pink[900]} /></TouchableOpacity></View>
						{services.map(([name, status, latency]) => (
							<View key={name} style={styles.serviceRow}><View style={styles.serviceIcon}><Server size={17} color={colors.green[600]} /></View><View style={styles.serviceCopy}><Text style={styles.serviceName}>{name}</Text><Text style={styles.serviceLatency}>Response time {latency}</Text></View><View style={styles.serviceStatus}><View style={styles.serviceDot} /><Text style={styles.serviceStatusText}>{status}</Text></View></View>
						))}
					</View>
					<View style={styles.healthFooter}><Activity size={18} color={colors.pink[900]} /><Text style={styles.healthFooterText}>Last checked just now</Text></View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'language') {
			const languages = [
				{ name: 'English', nativeName: 'English' },
				{ name: 'French', nativeName: 'Français' },
			];
			const selectLanguage = async value => {
				await saveLanguage(value);
			};
			return (
				<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={styles.languageCard}>
						<Text style={styles.detailTitle}>Language</Text>
						<Text style={styles.detailDescription}>{t('chooseLanguage')}</Text>
						{languages.map(option => (
							<TouchableOpacity key={option.name} style={[styles.languageRow, language === option.name && styles.languageRowActive]} onPress={() => selectLanguage(option.name)} accessibilityRole="radio" accessibilityState={{ selected: language === option.name }}>
								<View><Text style={styles.languageName}>{option.name === 'English' ? t('english') : t('french')}</Text><Text style={styles.languageCode}>{option.name}</Text></View>
								{language === option.name && <CheckCircle2 size={21} color={colors.pink[900]} />}
							</TouchableOpacity>
						))}
					</View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'theme') {
			const themes = [
				{ name: 'Light', description: 'Bright and clear', Icon: Sun },
				{ name: 'Dark', description: 'Reduced brightness for low-light use', Icon: Moon },
				{ name: 'System', description: 'Follow your device preference', Icon: Activity },
			];
			const selectTheme = async value => {
				setTheme(value);
			};
			return (
				<Animated.ScrollView style={[styles.container, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={[styles.themeCard, isDark && styles.darkCard]}>
						<Text style={styles.detailTitle}>{t('theme')}</Text>
						<Text style={styles.detailDescription}>Choose how the app should appear.</Text>
						{themes.map(({ name, description, Icon }) => (
							<TouchableOpacity key={name} style={[styles.themeRow, theme === name && styles.themeRowActive]} onPress={() => selectTheme(name)} accessibilityRole="radio" accessibilityState={{ selected: theme === name }}>
								<View style={styles.themeRowCopy}><View style={styles.themeIcon}><Icon size={19} color={colors.orange[600]} /></View><View><Text style={styles.themeName}>{name}</Text><Text style={styles.themeDescription}>{description}</Text></View></View>
								{theme === name && <CheckCircle2 size={21} color={colors.pink[900]} />}
							</TouchableOpacity>
						))}
						<View style={styles.themeToggleRow}>
							<View><Text style={styles.themeName}>Dark mode</Text><Text style={styles.themeDescription}>Apply the dark appearance immediately</Text></View>
							<Switch value={theme === 'Dark'} onValueChange={enabled => selectTheme(enabled ? 'Dark' : 'Light')} trackColor={{ false: colors.slate[300], true: colors.pink[100] }} thumbColor={theme === 'Dark' ? colors.pink[900] : colors.white} accessibilityLabel="Toggle dark mode" />
						</View>
					</View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'privacy-policy') {
			return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}>
						<ArrowLeft size={18} color={colors.slate[700]} />
						<Text style={styles.backText}>Settings</Text>
					</TouchableOpacity>
					<View style={styles.policyCard}>
						<View style={[styles.detailIcon, { backgroundColor: colors.slate[100] }]}><ShieldHalf size={28} color={colors.slate[700]} /></View>
						<Text style={styles.detailTitle}>Privacy &amp; Policy</Text>
						<Text style={styles.policyText}>Presenza is committed to protecting the privacy, safety, and trust of every organization and employee who uses our attendance platform. We collect only the information needed to provide secure attendance services, including employee identity details, check-in and check-out activity, verification results, device information, and location data when enabled by an authorized organization. This information is used to record attendance, maintain accurate operational reports, improve system reliability, detect unusual activity, and support authorized administrators.</Text>
						<Text style={styles.policyText}>Access to attendance records is limited according to role and business need. Administrators may manage employee records and operational reports, while employees may access only the information associated with their own account. We use access controls, secure storage, audit activity, and ongoing monitoring to help prevent unauthorized access, alteration, disclosure, or loss of information. Organizations are responsible for configuring roles carefully and ensuring that their use of Presenza follows applicable employment, privacy, and data-protection requirements.</Text>
						<Text style={styles.policyText}>Presenza does not sell personal information. We retain information only for as long as it is needed for the service, contractual obligations, legal requirements, dispute resolution, security investigations, or legitimate operational purposes. Authorized customers may request correction or deletion of records where permitted by law and may contact their system administrator or support representative for assistance with privacy requests.</Text>
						<Text style={styles.policyText}>By using Presenza, users agree to provide accurate account information, protect their login credentials, use the platform lawfully, and respect the confidentiality of attendance data. We may update this policy when our services, security practices, or legal obligations change. Material updates will be communicated through the application or by an authorized organization administrator.</Text>
					</View>
				</Animated.ScrollView>
			);
		}
		if (selectedOption.key === 'security-standards') {
			const standards = [
				['Zero Trust Principle', 'Every access request is verified continuously using identity, device, and context signals.', 'This helps prevent unauthorized access, even when a password or device has already been compromised.', ShieldCheck],
				['Data Encryption', 'Attendance data is protected in transit and at rest using modern encryption practices.', 'Encryption makes attendance records unreadable to anyone who does not have the required security key.', ShieldHalf],
				['Role-Based Access Control', 'Permissions are limited by role so users can access only the records and tools they need.', 'RBAC reduces unnecessary exposure by giving administrators and employees only the permissions required for their responsibilities.', UserRound],
				['Audit Monitoring', 'Security events and administrative activity are tracked to support accountability and investigation.', 'Audit trails help teams identify unusual behavior, investigate incidents, and confirm who accessed or changed information.', Activity],
				['Secure Operations', 'System health and access controls are reviewed continuously to protect service availability.', 'These practices keep attendance services reliable, identify weaknesses early, and support a fast response to operational issues.', Server],
			];
			return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
					<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}><ArrowLeft size={18} color={colors.slate[700]} /><Text style={styles.backText}>Settings</Text></TouchableOpacity>
					<View style={styles.standardsCard}>
						<View style={[styles.detailIcon, { backgroundColor: colors.primary[50] }]}><ShieldCheck size={28} color={colors.primary[600]} /></View>
						<Text style={styles.detailTitle}>Security Standards</Text>
						<Text style={styles.detailDescription}>Professional controls that protect Presenza attendance operations.</Text>
						{standards.map(([title, description, explanation, Icon]) => (
							<TouchableOpacity key={title} style={[styles.standardRow, selectedStandard === title && styles.standardRowSelected]} onPress={() => setSelectedStandard(selectedStandard === title ? null : title)} accessibilityRole="button" accessibilityState={{ selected: selectedStandard === title }}>
								<View style={styles.standardIcon}><Icon size={18} color={colors.primary[600]} /></View>
								<View style={styles.standardCopy}><Text style={styles.standardTitle}>{title}</Text><Text style={styles.standardDescription}>{description}</Text>{selectedStandard === title && <Text style={styles.standardExplanation}>{explanation}</Text>}</View>
							</TouchableOpacity>
						))}
					</View>
				</Animated.ScrollView>
			);
		}
		const Icon = selectedOption.icon;
		return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
				<TouchableOpacity style={styles.backButton} onPress={() => setSelectedKey(null)}>
					<ArrowLeft size={18} color={colors.slate[700]} />
					<Text style={styles.backText}>Settings</Text>
				</TouchableOpacity>
				<View style={styles.detailCard}>
					<View style={[styles.detailIcon, { backgroundColor: selectedOption.background }]}><Icon size={28} color={selectedOption.color} /></View>
					<Text style={styles.detailTitle}>{selectedOption.title}</Text>
					<Text style={styles.detailDescription}>{selectedOption.description}</Text>
					<View style={styles.detailStatus}><Text style={styles.detailStatusText}>Configuration page</Text><Text style={styles.detailStatusMuted}>Ready for your settings</Text></View>
				</View>
			</Animated.ScrollView>
		);
	}

	return (
				<Animated.ScrollView style={[styles.container, isDark && styles.darkContainer, screenStyle]} contentContainerStyle={styles.content}>
			<View style={styles.headingCard}>
				<View>
					<Text style={styles.eyebrow}>Profile</Text>
					<Text style={styles.title}>Settings</Text>
				</View>
				<View style={styles.statusBadge}>
					<Text style={styles.statusBadgeText}>Active</Text>
				</View>
			</View>
			<View style={styles.optionsCard}>
				{SETTINGS_OPTIONS.map(option => {
					const Icon = option.icon;
					return (
						<TouchableOpacity key={option.key} style={styles.optionRow} onPress={() => setSelectedKey(option.key)}>
							<View style={[styles.optionIcon, { backgroundColor: option.background }]}><Icon size={18} color={option.color} /></View>
							<View style={styles.optionCopy}><Text style={styles.optionTitle}>{t(option.key === 'system-health' ? 'systemHealth' : option.key === 'privacy-policy' ? 'privacyPolicy' : option.key)}</Text><Text style={styles.optionDescription}>{option.description}</Text></View>
							<ChevronRight size={18} color={colors.slate[400]} />
						</TouchableOpacity>
					);
				})}
			</View>
			<TouchableOpacity style={styles.signOutButton} onPress={logout}>
				<LogOut size={18} color={colors.danger} />
				<Text style={styles.signOutText}>Sign Out</Text>
			</TouchableOpacity>
		</Animated.ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f4f7f5' },
	darkContainer: { backgroundColor: colors.slate[900] },
	content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
	headingCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#ffffff',
		borderRadius: 22,
		borderWidth: 1,
		borderColor: '#e2e8f0',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		shadowColor: '#0f172a',
		shadowOpacity: 0.04,
		shadowRadius: 10,
		elevation: 1,
	},
	eyebrow: { color: '#16856B', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
	title: { fontSize: 24, fontWeight: '800', color: colors.slate[900], marginTop: 3 },
	subtitle: { fontSize: 14, color: colors.slate[500], lineHeight: 20, marginTop: spacing.xs },
	statusBadge: {
		backgroundColor: '#ecfdf5',
		borderWidth: 1,
		borderColor: '#a7f3d0',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	statusBadgeText: { color: '#047857', fontSize: 11, fontWeight: '700' },
	optionsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
	optionRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm },
	optionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
	optionCopy: { flex: 1 },
	optionTitle: { color: '#172033', fontSize: 14, fontWeight: '700' },
	optionDescription: { color: '#667085', fontSize: 12, marginTop: 3, lineHeight: 18 },
	signOutButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#fecaca', borderRadius: 14, backgroundColor: '#fef2f2' },
	signOutText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
	backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
	backText: { color: colors.slate[700], fontSize: 14, fontWeight: '600' },
	detailCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg, alignItems: 'center' },
	detailIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
	detailTitle: { color: colors.slate[900], fontSize: 22, fontWeight: '700' },
	detailDescription: { color: colors.slate[500], fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs },
	detailStatus: { width: '100%', marginTop: spacing.lg, padding: spacing.md, borderRadius: 8, backgroundColor: colors.slate[50] },
	detailStatusText: { color: colors.slate[800], fontSize: 13, fontWeight: '700' },
	detailStatusMuted: { color: colors.slate[500], fontSize: 12, marginTop: 4 },
	healthHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.green[50], borderWidth: 1, borderColor: colors.green[200], borderRadius: 12, padding: spacing.lg },
	healthIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
	healthHeroCopy: { flex: 1, marginLeft: spacing.md },
	healthTitle: { color: colors.green[700], fontSize: 19, fontWeight: '700' },
	healthSubtitle: { color: colors.slate[600], fontSize: 13, lineHeight: 19, marginTop: 3 },
	healthCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.md, marginTop: spacing.md },
	healthCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
	healthCardTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '700' },
	refreshButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50] },
	serviceRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingVertical: spacing.md },
	serviceIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green[50] },
	serviceCopy: { flex: 1, marginLeft: spacing.sm },
	serviceName: { color: colors.slate[800], fontSize: 14, fontWeight: '600' },
	serviceLatency: { color: colors.slate[500], fontSize: 12, marginTop: 3 },
	serviceStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	serviceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green[600] },
	serviceStatusText: { color: colors.green[700], fontSize: 12, fontWeight: '700' },
	healthFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
	healthFooterText: { color: colors.slate[500], fontSize: 12 },
	accountCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg, alignItems: 'center' },
	accountAvatarRing: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50], marginBottom: spacing.sm },
	accountName: { color: colors.slate[900], fontSize: 22, fontWeight: '700' },
	accountRole: { color: colors.slate[500], fontSize: 14, marginTop: 3 },
	accountForm: { width: '100%', marginTop: spacing.lg },
	accountLabel: { color: colors.slate[700], fontSize: 13, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
	accountInput: { width: '100%', borderWidth: 1, borderColor: colors.slate[300], borderRadius: 8, padding: 12, color: colors.slate[900], fontSize: 15, backgroundColor: colors.slate[50] },
	saveAccountButton: { backgroundColor: colors.pink[900], borderRadius: 8, alignItems: 'center', padding: spacing.md, marginTop: spacing.lg },
	saveAccountText: { color: colors.white, fontSize: 15, fontWeight: '700' },
	accountSuccess: { color: colors.green[600], fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
	accountMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingTop: spacing.md, marginTop: spacing.md },
	accountMetaLabel: { color: colors.slate[500], fontSize: 13 },
	accountMetaValue: { color: colors.slate[800], fontSize: 13, fontWeight: '600' },
	policyCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg },
	policyText: { color: colors.slate[700], fontSize: 14, lineHeight: 22, marginTop: spacing.md },
	standardsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg },
	languageCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg },
	languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingVertical: spacing.md, marginTop: spacing.md, borderRadius: 8 },
	languageRowActive: { backgroundColor: colors.pink[50], paddingHorizontal: spacing.sm },
	languageName: { color: colors.slate[800], fontSize: 15, fontWeight: '700' },
	languageCode: { color: colors.slate[500], fontSize: 12, marginTop: 3 },
	themeCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.lg },
	darkCard: { backgroundColor: colors.slate[800], borderColor: colors.slate[600] },
	themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingVertical: spacing.md, marginTop: spacing.md, borderRadius: 8 },
	themeRowActive: { backgroundColor: colors.pink[50], paddingHorizontal: spacing.sm },
	themeRowCopy: { flexDirection: 'row', alignItems: 'center' },
	themeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange[50], marginRight: spacing.sm },
	themeName: { color: colors.slate[800], fontSize: 15, fontWeight: '700' },
	themeDescription: { color: colors.slate[500], fontSize: 12, marginTop: 3 },
	themeToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingTop: spacing.md, marginTop: spacing.md },
	standardRow: { flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: colors.slate[100], paddingVertical: spacing.md, marginTop: spacing.md },
	standardRowSelected: { backgroundColor: colors.primary[50], borderRadius: 8, paddingHorizontal: spacing.sm },
	standardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] },
	standardCopy: { flex: 1, marginLeft: spacing.sm },
	standardTitle: { color: colors.slate[800], fontSize: 14, fontWeight: '700' },
	standardDescription: { color: colors.slate[500], fontSize: 12, lineHeight: 18, marginTop: 3 },
	standardExplanation: { color: colors.slate[700], fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
	notificationDetailType: { color: colors.orange[600], fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: spacing.sm },
	notificationDetailMessage: { color: colors.slate[700], fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: spacing.md },
	notificationDetailDate: { color: colors.slate[400], fontSize: 12, marginTop: spacing.lg },
	supportScreen: { flex: 1, backgroundColor: colors.slate[50] },
	supportContent: { padding: spacing.md, paddingBottom: 110 },
	chatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
	chatBotIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green[50] },
	chatStatus: { color: colors.green[600], fontSize: 12, marginTop: 3 },
	chatCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.md, gap: spacing.sm },
	chatBubble: { maxWidth: '86%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 14 },
	assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.slate[100], borderBottomLeftRadius: 4 },
	userBubble: { alignSelf: 'flex-end', backgroundColor: colors.pink[800], borderBottomRightRadius: 4 },
	chatBubbleText: { color: colors.slate[700], fontSize: 13, lineHeight: 19 },
	userBubbleText: { color: colors.white },
	taskHeading: { color: colors.slate[700], fontSize: 13, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
	taskList: { gap: spacing.sm },
	taskChip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 9, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
	taskChipText: { color: colors.slate[700], fontSize: 13 },
	chatComposer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.slate[200] },
	chatInput: { flex: 1, minHeight: 42, maxHeight: 90, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 21, color: colors.slate[900], fontSize: 13, backgroundColor: colors.slate[50] },
	sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[800] },
	reportsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
	reportList: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, paddingHorizontal: spacing.md },
	reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
	reportIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50] },
	reportCopy: { flex: 1, marginHorizontal: spacing.sm },
	reportName: { color: colors.slate[800], fontSize: 14, fontWeight: '700' },
	reportMeta: { color: colors.slate[500], fontSize: 11, marginTop: 4 },
	reportDetailMeta: { color: colors.slate[500], fontSize: 12, marginTop: spacing.sm },
	reportDetailContent: { color: colors.slate[700], fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: spacing.lg },
	notificationsPageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
	notificationCountText: { color: colors.slate[500], fontSize: 12, marginTop: 4 },
	markAllText: { color: colors.pink[800], fontSize: 12, fontWeight: '700' },
	notificationSearch: { height: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 8, backgroundColor: colors.white },
	notificationSearchInput: { flex: 1, color: colors.slate[900], fontSize: 13 },
	notificationList: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, paddingHorizontal: spacing.md },
	settingsNotificationRow: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
	settingsNotificationInner: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
	settingsUnreadRow: { backgroundColor: colors.slate[50] },
	settingsNotificationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange[50] },
	settingsNotificationCopy: { flex: 1, marginLeft: spacing.sm },
	settingsNotificationTitleRow: { flexDirection: 'row', alignItems: 'center' },
	settingsNotificationTitle: { flex: 1, color: colors.slate[800], fontSize: 14, fontWeight: '700' },
	settingsUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[600], marginLeft: spacing.sm },
	settingsNotificationMessage: { color: colors.slate[600], fontSize: 12, lineHeight: 18, marginTop: 3 },
	settingsNotificationTime: { color: colors.slate[400], fontSize: 11, marginTop: 5 },
	notificationMenuButton: { width: 28, height: 28, marginLeft: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
	notificationMenuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
	notificationMenuDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.slate[400] },
	notificationActionMenu: { position: 'absolute', top: 36, right: 4, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, paddingVertical: 6, minWidth: 150, shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3, zIndex: 20 },
	notificationActionRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
	notificationActionDelete: { borderBottomWidth: 0 },
	notificationActionText: { color: colors.slate[700], fontSize: 13, fontWeight: '600' },
	notificationActionDeleteText: { color: colors.danger },
	emptyNotifications: { color: colors.slate[500], fontSize: 13, padding: spacing.md, textAlign: 'center' },
	modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	actionSheet: { backgroundColor: '#f4f7f5', padding: spacing.md, paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
	actionSheetRow: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100], alignItems: 'center' },
	actionSheetDelete: { borderBottomWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
	actionSheetText: { color: colors.slate[800], fontSize: 16, fontWeight: '500' },
	actionSheetDeleteText: { color: colors.danger, fontWeight: '600' },
	actionSheetCancelSpacer: { height: spacing.sm },
	actionSheetCancel: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
	actionSheetCancelText: { color: colors.slate[800], fontSize: 16, fontWeight: '600' },
	modalBackdropCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
	confirmDialogCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: '100%', maxWidth: 340, shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 },
	confirmDialogTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
	confirmDialogMessage: { color: colors.slate[600], fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: spacing.xl },
	confirmDialogActions: { flexDirection: 'row', gap: spacing.md },
	confirmDialogButtonCancel: { flex: 1, paddingVertical: 12, backgroundColor: colors.slate[100], borderRadius: 10, alignItems: 'center' },
	confirmDialogButtonCancelText: { color: colors.slate[700], fontSize: 15, fontWeight: '600' },
	confirmDialogButtonConfirm: { flex: 1, paddingVertical: 12, backgroundColor: colors.pink[900], borderRadius: 10, alignItems: 'center' },
	confirmDialogButtonDanger: { backgroundColor: colors.danger },
	confirmDialogButtonConfirmText: { color: colors.white, fontSize: 15, fontWeight: '600' },
	confirmDialogButtonDangerText: { color: colors.white },
});

export default Settings;
