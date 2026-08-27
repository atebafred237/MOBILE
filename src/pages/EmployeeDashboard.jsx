import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const EmployeeDashboard = () => {
	const navigation = useNavigation();
	const { user } = useAuth();
	const { attendance } = useData();
	const { t } = useLanguage();
	const employeeId = Number(user?.matricule?.replace(/\D/g, '')) || 42;
	const records = attendance.filter(record => record.employeeId === employeeId);
	const presentCount = records.filter(record => record.status === 'Present').length;
	const lateCount = records.filter(record => record.status === 'Late').length;
	const absentCount = records.filter(record => record.status === 'Absent').length;
	const attendanceRate = records.length ? Math.round(((presentCount + lateCount) / records.length) * 100) : 0;
	const today = new Date().toISOString().split('T')[0];
	const todayRecord = records.find(record => record.date === today);
	const recentRecords = records.slice(0, 3);

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<View style={styles.hero}>
				<View style={styles.heroCopy}>
					  <Text style={styles.eyebrow}>{t('dashboardEyebrow')}</Text>
					  <Text style={styles.title}>{t('hello')}, {user?.name?.split(' ')[0] || 'there'}</Text>
					  <Text style={styles.subtitle}>{t('dashboardSubtitle')}</Text>
				</View>
				<CalendarCheck2 size={42} color={colors.pink[100]} />
			</View>

			<View style={styles.todayCard}>
				<View style={styles.sectionHeading}>
					  <Text style={styles.sectionTitle}>{t('todaysAttendance')}</Text>
					<Text style={styles.todayDate}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
				</View>
				<View style={styles.todayRow}>
					<View style={[styles.statusIcon, todayRecord?.status === 'Absent' ? styles.absentIcon : styles.presentIcon]}>
						{todayRecord?.status === 'Absent' ? <XCircle size={25} color={colors.danger} /> : <CheckCircle2 size={25} color={colors.pink[900]} />}
					</View>
					<View style={styles.todayCopy}>
						<Text style={styles.todayStatus}>{todayRecord ? t(todayRecord.status.toLowerCase()) : t('noRecordYet')}</Text>
						<Text style={styles.todayMeta}>{todayRecord ? `${todayRecord.timestamp} - ${todayRecord.checkOut}` : t('checkInNotRecorded')}</Text>
					</View>
				</View>
			</View>

			<View style={styles.statsGrid}>
				  <View style={styles.statCard}>
				  <View style={styles.statHeader}><Text style={styles.statLabel}>{t('attendanceRate')}</Text><CalendarCheck2 size={19} color={colors.pink[900]} /></View>
					<Text style={styles.statValue}>{attendanceRate}%</Text>
				</View>
				  <View style={styles.statCard}>
				  <View style={styles.statHeader}><Text style={styles.statLabel}>{t('presentDays')}</Text><CheckCircle2 size={19} color={colors.green[600]} /></View>
					<Text style={styles.statValue}>{presentCount}</Text>
				</View>
				  <View style={styles.statCard}>
				  <View style={styles.statHeader}><Text style={styles.statLabel}>{t('lateDays')}</Text><Clock3 size={19} color={colors.warning} /></View>
					<Text style={styles.statValue}>{lateCount}</Text>
				</View>
				  <View style={styles.statCard}>
				  <View style={styles.statHeader}><Text style={styles.statLabel}>{t('absentDays')}</Text><XCircle size={19} color={colors.danger} /></View>
					<Text style={[styles.statValue, styles.absentValue]}>{absentCount}</Text>
				</View>
			</View>

			<View style={styles.activityCard}>
				<View style={styles.sectionHeading}>
					  <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
					<TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('EmployeeAttendance')} accessibilityRole="button">
						<Text style={styles.viewButtonText}>{t('viewAll')}</Text><ArrowRight size={15} color={colors.pink[900]} />
					</TouchableOpacity>
				</View>
				{recentRecords.length ? recentRecords.map(record => (
					<View key={record.id} style={styles.activityRow}>
						<Clock3 size={18} color={record.status === 'Late' ? colors.warning : record.status === 'Absent' ? colors.danger : colors.green[600]} />
						<View style={styles.activityCopy}><Text style={styles.activityDate}>{record.date}</Text><Text style={styles.activityMeta}>{record.timestamp} - {record.checkOut}</Text></View>
												<Text style={[styles.activityStatus, record.status === 'Late' ? styles.lateBadge : record.status === 'Absent' ? styles.absentBadge : styles.presentBadge]}>{t(record.status.toLowerCase())}</Text>
					</View>
				)) : <Text style={styles.emptyText}>{t('noActivity')}</Text>}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#efeae2' },
	content: { padding: spacing.md, paddingBottom: spacing.xl },
	hero: { backgroundColor: '#3b031b', borderRadius: 4, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	heroCopy: { flex: 1 },
	eyebrow: { color: colors.pink[100], fontSize: 11, fontWeight: '700', letterSpacing: 1 },
	title: { color: colors.white, fontSize: 25, fontWeight: '700', marginTop: spacing.xs },
	subtitle: { color: colors.pink[50], fontSize: 14, marginTop: spacing.xs },
	todayCard: { backgroundColor: colors.white, borderRadius: 4, padding: spacing.md, marginTop: spacing.md },
	sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	sectionTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '700' },
	todayDate: { color: colors.slate[500], fontSize: 12 },
	todayRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
	statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
	presentIcon: { backgroundColor: colors.pink[50] },
	absentIcon: { backgroundColor: '#fef2f2' },
	todayCopy: { marginLeft: spacing.md },
	todayStatus: { color: colors.slate[800], fontSize: 16, fontWeight: '700' },
	todayMeta: { color: colors.slate[500], fontSize: 13, marginTop: 3 },
	statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
	statCard: { width: '48%', backgroundColor: colors.white, borderRadius: 4, padding: spacing.md, borderTopWidth: 3, borderTopColor: colors.pink[900] },
	statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
	statValue: { color: colors.pink[900], fontSize: 22, fontWeight: '700' },
	absentValue: { color: colors.danger },
	statLabel: { color: colors.slate[500], fontSize: 12, marginTop: 2 },
	activityCard: { backgroundColor: colors.white, borderRadius: 4, padding: spacing.md, marginTop: spacing.md },
	viewButton: { flexDirection: 'row', alignItems: 'center', gap: 3 },
	viewButtonText: { color: colors.pink[900], fontSize: 13, fontWeight: '700' },
	activityRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.pink[50], paddingVertical: spacing.md },
	activityCopy: { flex: 1, marginLeft: spacing.sm },
	activityDate: { color: colors.slate[800], fontSize: 14, fontWeight: '600' },
	activityMeta: { color: colors.slate[500], fontSize: 12, marginTop: 3 },
	activityStatus: { fontSize: 12, fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
	presentBadge: { color: colors.green[700], backgroundColor: colors.green[50] },
	lateBadge: { color: '#92400e', backgroundColor: '#fef3c7' },
	absentBadge: { color: colors.danger, backgroundColor: '#fef2f2' },
	emptyText: { color: colors.slate[500], fontSize: 13, marginTop: spacing.md },
});

export default EmployeeDashboard;
