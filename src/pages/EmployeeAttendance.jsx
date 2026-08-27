import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = ['All', 'Present', 'Late', 'Absent'];
const PERIODS = ['Daily', 'Weekly', 'Monthly'];

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const { attendance } = useData();
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [period, setPeriod] = useState('Monthly');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const employeeId = Number(user?.matricule?.replace(/\D/g, '')) || 42;
  const records = attendance.filter(record => record.employeeId === employeeId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodRecords = records.filter(record => {
    const recordDate = new Date(`${record.date}T00:00:00`);
    if (period === 'Daily') return recordDate.getTime() === today.getTime();
    if (period === 'Weekly') {
      const daysAgo = Math.floor((today.getTime() - recordDate.getTime()) / 86400000);
      return daysAgo >= 0 && daysAgo < 7;
    }
    return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
  });
  const filteredRecords = activeFilter === 'All' ? periodRecords : periodRecords.filter(record => record.status === activeFilter);
  const presentCount = periodRecords.filter(record => record.status === 'Present').length;
  const lateCount = periodRecords.filter(record => record.status === 'Late').length;
  const absentCount = periodRecords.filter(record => record.status === 'Absent').length;
  const attendanceRate = periodRecords.length ? Math.round(((presentCount + lateCount) / periodRecords.length) * 100) : 0;

  const exportAttendance = () => {
    const header = ['Date', 'Check-in', 'Check-out', 'Duration', 'Status'];
    const rows = filteredRecords.map(record => [record.date, record.timestamp, record.checkOut, record.totalHours, record.status]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-attendance.csv';
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    Alert.alert('Export ready', 'Your attendance table is ready to export as a CSV file.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><CalendarDays size={24} color={colors.white} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('myAttendance')}</Text>
          <Text style={styles.subtitle}>{t('attendanceSubtitle')}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{attendanceRate}%</Text>
          <Text style={styles.summaryLabel}>{t('attendanceRate')}</Text>
        </View>
        <View style={[styles.summaryCard, styles.presentSummaryCard]}>
          <Text style={styles.summaryValue}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>{t('presentDays')}</Text>
        </View>
        <View style={[styles.summaryCard, styles.lateSummaryCard]}>
          <Text style={styles.summaryValue}>{lateCount}</Text>
          <Text style={styles.summaryLabel}>{t('lateDays')}</Text>
        </View>
      </View>

      <View style={styles.listCard}>
        <View style={styles.listHeading}>
          <Text style={styles.listTitle}>{t('attendanceRecords')}</Text>
          <TouchableOpacity style={styles.exportButton} onPress={exportAttendance} accessibilityRole="button">
            <Download size={16} color={colors.white} />
            <Text style={styles.exportButtonText}>{t('export')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.periodRow}>
          <Text style={styles.recordCount}>{periodRecords.length} records</Text>
          <View style={styles.periodMenuWrap}>
            <TouchableOpacity style={styles.periodButton} onPress={() => setPeriodMenuOpen(open => !open)} accessibilityRole="button" accessibilityLabel="Filter attendance period">
              <CalendarDays size={15} color={colors.pink[900]} />
              <Text style={styles.periodButtonText}>{period}</Text>
              <ChevronDown size={15} color={colors.pink[900]} />
            </TouchableOpacity>
            {periodMenuOpen && (
              <View style={styles.periodMenu}>
                {PERIODS.map(option => (
                  <TouchableOpacity key={option} style={styles.periodOption} onPress={() => { setPeriod(option); setPeriodMenuOpen(false); }}>
                    <Text style={[styles.periodOptionText, period === option && styles.periodOptionActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filter, activeFilter === filter && styles.filterActive]}
              onPress={() => setActiveFilter(filter)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderText}>{t('date')}</Text>
              <Text style={styles.tableHeaderText}>{t('checkIn')}</Text>
              <Text style={styles.tableHeaderText}>{t('checkOut')}</Text>
              <Text style={styles.tableHeaderText}>{t('duration')}</Text>
              <Text style={[styles.tableHeaderText, styles.statusColumn]}>{t('status')}</Text>
            </View>
            {filteredRecords.map(record => (
              <View key={record.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{record.date}</Text>
                <Text style={styles.tableCell}>{record.timestamp}</Text>
                <Text style={styles.tableCell}>{record.checkOut}</Text>
                <Text style={styles.tableCell}>{record.totalHours}</Text>
                <View style={styles.statusColumn}><Text style={[styles.statusBadge, record.status === 'Present' ? styles.presentBadge : record.status === 'Late' ? styles.lateBadge : styles.absentBadge]}>{t(record.status.toLowerCase())}</Text></View>
              </View>
            ))}
          </View>
        </ScrollView>
        {!filteredRecords.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyText}>There are no {activeFilter.toLowerCase()} records for this period.</Text>
          </View>
        ) : null}
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>{filteredRecords.length ? `${filteredRecords.length} records` : 'No records found'}</Text>
          <View style={styles.paginationActions}>
            <TouchableOpacity style={styles.paginationButton} disabled accessibilityLabel="Previous attendance page"><ChevronLeft size={18} color={colors.slate[300]} /></TouchableOpacity>
            <TouchableOpacity style={styles.paginationButton} disabled accessibilityLabel="Next attendance page"><ChevronRight size={18} color={colors.slate[300]} /></TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Monthly overview</Text>
        <Text style={styles.noteText}>{absentCount} absent day{absentCount === 1 ? '' : 's'} recorded in this period.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efeae2' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b031b', borderRadius: 4, padding: spacing.md },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: spacing.sm },
  title: { color: colors.white, fontSize: 21, fontWeight: '700' },
  subtitle: { color: colors.pink[50], fontSize: 13, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.white, padding: spacing.sm, borderRadius: 4, borderTopWidth: 3, borderTopColor: colors.pink[900] },
  presentSummaryCard: { borderTopColor: colors.green[600] },
  lateSummaryCard: { borderTopColor: colors.warning },
  summaryValue: { color: colors.pink[900], fontSize: 22, fontWeight: '700' },
  summaryLabel: { color: colors.slate[500], fontSize: 11, marginTop: 2 },
  listCard: { backgroundColor: colors.white, marginTop: spacing.md, padding: spacing.md, borderRadius: 4 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { color: colors.slate[900], fontSize: 17, fontWeight: '700' },
  recordCount: { color: colors.slate[500], fontSize: 12 },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, zIndex: 5 },
  periodMenuWrap: { position: 'relative', zIndex: 10 },
  periodButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.pink[100], borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.pink[50] },
  periodButtonText: { color: colors.pink[900], fontSize: 13, fontWeight: '700' },
  periodMenu: { position: 'absolute', top: 44, right: 0, minWidth: 110, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.pink[100], borderRadius: 8, shadowColor: colors.slate[900], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6, zIndex: 20 },
  periodOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  periodOptionText: { color: colors.slate[700], fontSize: 13 },
  periodOptionActive: { color: colors.pink[900], fontWeight: '700' },
  exportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.pink[800], borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  exportButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  filterRow: { gap: spacing.sm, paddingVertical: spacing.md },
  filter: { borderWidth: 1, borderColor: colors.pink[100], borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.pink[900], borderColor: colors.pink[900] },
  filterText: { color: colors.pink[900], fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  table: { minWidth: 550 },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', minHeight: 38, paddingHorizontal: spacing.sm, backgroundColor: colors.pink[50], borderBottomWidth: 1, borderBottomColor: colors.pink[100] },
  tableHeaderText: { width: 110, color: colors.pink[900], fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.pink[50] },
  tableCell: { width: 110, color: colors.slate[700], fontSize: 12, paddingRight: spacing.sm },
  statusColumn: { width: 110 },
  statusBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  presentBadge: { color: colors.green[700], backgroundColor: colors.green[50] },
  lateBadge: { color: '#92400e', backgroundColor: '#fef3c7' },
  absentBadge: { color: colors.danger, backgroundColor: '#fef2f2' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.pink[50] },
  paginationText: { color: colors.slate[500], fontSize: 12 },
  paginationActions: { flexDirection: 'row', gap: spacing.sm },
  paginationButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate[200], borderRadius: 7 },
  recordRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.pink[50], paddingVertical: spacing.md },
  statusIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pink[50], alignItems: 'center', justifyContent: 'center' },
  recordMain: { flex: 1, marginLeft: spacing.sm },
  recordDate: { color: colors.slate[800], fontSize: 14, fontWeight: '700' },
  recordMeta: { color: colors.slate[500], fontSize: 11, marginTop: 3 },
  recordTimes: { alignItems: 'flex-end', marginLeft: spacing.sm },
  timeText: { color: colors.slate[800], fontSize: 13, fontWeight: '600' },
  checkoutText: { color: colors.slate[500], fontSize: 11, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { color: colors.slate[800], fontSize: 15, fontWeight: '700' },
  emptyText: { color: colors.slate[500], fontSize: 13, marginTop: spacing.xs },
  noteCard: { backgroundColor: colors.pink[50], marginTop: spacing.md, padding: spacing.md, borderRadius: 4 },
  noteTitle: { color: colors.pink[900], fontSize: 14, fontWeight: '700' },
  noteText: { color: colors.slate[700], fontSize: 13, marginTop: spacing.xs },
});

export default EmployeeAttendance;
