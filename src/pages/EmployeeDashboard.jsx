import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AttendanceTrendChartCard from '../components/AttendanceTrendChartCard';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const getTrendData = (records, period) => {
  const labels = period === 'Month' ? ['W1', 'W2', 'W3', 'W4'] : period === 'Day' ? ['6a', '9a', '12p', '3p', '6p'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = labels.map(label => ({ label, present: 0, late: 0, absent: 0 }));

  records.forEach(record => {
    const date = new Date(`${record.date}T00:00:00`);
    const timeMatch = record.timestamp && record.timestamp !== '---' ? record.timestamp.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i) : null;
    let bucketIndex = 0;

    if (period === 'Month') {
      bucketIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 3);
    } else if (period === 'Day') {
      if (timeMatch) {
        let hour = Number(timeMatch[1]);
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        if (hour < 9) bucketIndex = 0;
        else if (hour < 12) bucketIndex = 1;
        else if (hour < 15) bucketIndex = 2;
        else if (hour < 18) bucketIndex = 3;
        else bucketIndex = 4;
      }
    } else {
      bucketIndex = (date.getDay() + 6) % 7;
    }

    if (bucketIndex < 0 || bucketIndex >= data.length) return;

    if (record.status === 'Present') data[bucketIndex].present += 1;
    if (record.status === 'Late') data[bucketIndex].late += 1;
    if (record.status === 'Absent') data[bucketIndex].absent += 1;
  });

  return data;
};

const EmployeeDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { attendance } = useData();
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('Week');

  const records = useMemo(() => {
    return attendance.map(a => {
      const checkInDate = a.timeIn ? new Date(a.timeIn) : null;
      const checkOutDate = a.timeOut ? new Date(a.timeOut) : null;
      
      const formatTime = d => d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '---';
      
      let totalHours = '0h';
      if (checkInDate && checkOutDate) {
        const diffMs = checkOutDate - checkInDate;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        totalHours = `${diffHrs}h ${diffMins}m`;
      }
      
      return {
        ...a,
        status: a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : 'Absent',
        timestamp: formatTime(checkInDate),
        checkOut: formatTime(checkOutDate),
        totalHours
      };
    });
  }, [attendance]);

  const presentCount = records.filter(record => record.status === 'Present').length;
  const lateCount = records.filter(record => record.status === 'Late').length;
  const absentCount = records.filter(record => record.status === 'Absent').length;
  const attendanceRate = records.length ? Math.round(((presentCount + lateCount) / records.length) * 100) : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(record => record.date === today);
  const trendData = useMemo(() => getTrendData(records, selectedPeriod), [records, selectedPeriod]);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const firstName = user?.name?.split(' ')[0] || 'Employee';
  const statusText = todayRecord ? t(todayRecord.status.toLowerCase()) : t('noRecordYet');
  const statusMeta = todayRecord ? `${todayRecord.timestamp} - ${todayRecord.checkOut}` : t('checkInNotRecorded');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dateOnly}>{todayLabel}</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.cardEyebrow}>Today�s attendance</Text>
          <View style={styles.iconBadge}>
            {todayRecord?.status === 'Absent' ? <XCircle size={18} color={colors.white} /> : <CheckCircle2 size={18} color={colors.white} />}
          </View>
        </View>

        <Text style={styles.heroStatus}>{statusText}</Text>

        <View style={styles.divider} />

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Check-in</Text>
            <Text style={styles.metaValue}>{todayRecord ? todayRecord.timestamp : '--:--'}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Check-out</Text>
            <Text style={styles.metaValue}>{todayRecord ? todayRecord.checkOut : '--:--'}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Hours</Text>
            <Text style={styles.metaValue}>{todayRecord ? todayRecord.totalHours : '0h'}</Text>
          </View>
        </View>

        <Text style={styles.heroMeta}>{statusMeta}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('EmployeeAttendance')}>
          <CalendarDays size={18} color={colors.white} />
          <Text style={styles.primaryButtonText}>Open attendance</Text>
          <ChevronRight size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>This week</Text>
            <Text style={styles.summarySubtitle}>Overview</Text>
          </View>
          <Text style={styles.summaryRate}>{attendanceRate}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, attendanceRate))}%` }]} />
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{presentCount}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumberLate}>{lateCount}</Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumberAbsent}>{absentCount}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumberDark}>{records.length}</Text>
            <Text style={styles.summaryLabel}>Days</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance trend</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>
      </View>

      <AttendanceTrendChartCard data={trendData} selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

      <View style={styles.activityCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EmployeeAttendance')}>
            <Text style={styles.linkText}>View all</Text>
          </TouchableOpacity>
        </View>

        {records.slice(0, 3).map(record => (
          <View key={record.id} style={styles.activityRow}>
            <View style={styles.activityIconWrap}>
              {record.status === 'Absent' ? <XCircle size={18} color={colors.danger} /> : record.status === 'Late' ? <Clock3 size={18} color={colors.warning} /> : <CheckCircle2 size={18} color={colors.green[600]} />}
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityDate}>{record.date}</Text>
              <Text style={styles.activityMeta}>{record.timestamp} � {record.checkOut}</Text>
            </View>
            <View style={[styles.statusPillInline, record.status === 'Absent' ? styles.absentPill : record.status === 'Late' ? styles.latePill : styles.presentPill]}>
              <View style={[styles.statusDotSmall, record.status === 'Absent' ? styles.absentDot : record.status === 'Late' ? styles.lateDot : styles.presentDot]} />
              <Text style={[styles.activityStatus, record.status === 'Absent' ? styles.absentStatusText : record.status === 'Late' ? styles.lateStatusText : styles.presentStatusText]}>{record.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f5' },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: {
    alignItems: 'flex-start',
    paddingTop: spacing.xs,
  },
  dateOnly: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroCard: {
    backgroundColor: '#172033',
    borderRadius: 28,
    padding: spacing.lg,
    shadowColor: '#172033',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    color: '#dfe7e5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16856B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatus: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaBox: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  metaLabel: {
    color: '#a6b0c3',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  heroMeta: {
    color: '#dce5ef',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: '#16856B',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#16856B',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dfe7e5',
    padding: spacing.md,
    shadowColor: '#172033',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  summarySubtitle: {
    color: '#667085',
    fontSize: 12,
    marginTop: 4,
  },
  summaryRate: {
    color: '#16856B',
    fontSize: 30,
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16856B',
    borderRadius: 999,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: spacing.sm,
  },
  summaryNumber: {
    color: '#16856B',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryNumberLate: {
    color: '#EA580C',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryNumberAbsent: {
    color: '#DC2626',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryNumberDark: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  cardWrapper: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe7e5',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },
  linkText: {
    color: '#16856B',
    fontSize: 13,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dfe7e5',
    padding: spacing.md,
    shadowColor: '#172033',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f7f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  activityDate: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
  },
  activityMeta: {
    color: '#667085',
    fontSize: 12,
    marginTop: 3,
  },
  statusPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  presentPill: { backgroundColor: 'rgba(16,185,129,0.12)' },
  latePill: { backgroundColor: 'rgba(245,158,11,0.12)' },
  absentPill: { backgroundColor: 'rgba(239,68,68,0.12)' },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  presentDot: { backgroundColor: '#10b981' },
  lateDot: { backgroundColor: '#f59e0b' },
  absentDot: { backgroundColor: '#ef4444' },
  activityStatus: { fontSize: 11, fontWeight: '800' },
  presentStatusText: { color: '#047857' },
  lateStatusText: { color: '#b45309' },
  absentStatusText: { color: '#b91c1c' },
});

export default EmployeeDashboard;
