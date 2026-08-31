import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, CheckCircle2, ChevronDown, Clock3, Download, XCircle } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = ['All', 'Present', 'Late', 'Absent'];
const RANGE_FILTERS = ['Daily', 'Weekly', 'Monthly'];

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const { attendance } = useData();
  const { t } = useLanguage();
  const [overviewFilter, setOverviewFilter] = useState('All');
  const [rangeFilter, setRangeFilter] = useState('Daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const todayISO = new Date().toISOString().split('T')[0];

  const employeeId = Number(user?.matricule?.replace(/\D/g, '')) || 42;
  const records = attendance.filter(record => record.employeeId === employeeId);

  const getDateRangeRecords = (dateString, range) => {
    const selected = new Date(`${dateString}T00:00:00`);
    const result = records.filter(record => {
      const recordDate = new Date(`${record.date}T00:00:00`);

      if (range === 'Daily') return record.date === dateString;
      if (range === 'Weekly') {
        const diffDays = Math.floor((selected.getTime() - recordDate.getTime()) / 86400000);
        return diffDays >= 0 && diffDays < 7;
      }
      return recordDate.getMonth() === selected.getMonth() && recordDate.getFullYear() === selected.getFullYear();
    });

    return result;
  };

  const selectedDateRecords = getDateRangeRecords(selectedDate, rangeFilter);

  const filteredRecords = overviewFilter === 'All' ? selectedDateRecords : selectedDateRecords.filter(record => record.status === overviewFilter);
  const presentCount = selectedDateRecords.filter(record => record.status === 'Present').length;
  const lateCount = selectedDateRecords.filter(record => record.status === 'Late').length;
  const absentCount = selectedDateRecords.filter(record => record.status === 'Absent').length;
  const attendanceRate = selectedDateRecords.length ? Math.round(((presentCount + lateCount) / selectedDateRecords.length) * 100) : 0;
  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

  const getStatusMeta = status => {
    if (status === 'Present') return { label: 'Present', tint: styles.presentTint, dot: styles.presentDot, icon: CheckCircle2, iconColor: '#10b981' };
    if (status === 'Late') return { label: 'Late', tint: styles.lateTint, dot: styles.lateDot, icon: Clock3, iconColor: '#f59e0b' };
    return { label: 'Absent', tint: styles.absentTint, dot: styles.absentDot, icon: XCircle, iconColor: '#ef4444' };
  };

  const openDatePicker = () => {
    setDatePickerValue(new Date(selectedDate));
    setShowDatePicker(true);
  };

  const resetFilters = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().split('T')[0]);
    setDatePickerValue(now);
    setRangeFilter('Daily');
    setOverviewFilter('All');
    setShowDatePicker(false);
  };

  const confirmDateSelection = () => {
    setSelectedDate(datePickerValue.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Attendance</Text>
          <Text style={styles.title}>My attendance</Text>
        </View>
        <View style={styles.datePill}>
          <CalendarDays size={14} color="#16856B" />
          <Text style={styles.dateText}>{todayLabel}</Text>
        </View>
      </View>

      <View style={styles.rangeRow}>
        {RANGE_FILTERS.map(range => (
          <TouchableOpacity
            key={range}
            style={[styles.rangeButton, rangeFilter === range && styles.rangeButtonActive]}
            onPress={() => setRangeFilter(range)}
            accessibilityRole="button"
          >
            <Text style={[styles.rangeButtonText, rangeFilter === range && styles.rangeButtonTextActive]}>{range}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.goalCard]}>
          <Text style={styles.summaryLabel}>Rate</Text>
          <Text style={styles.summaryValue}>{attendanceRate}%</Text>
        </View>
        <View style={[styles.summaryCard, styles.goalCard]}>
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={[styles.summaryValue, styles.presentText]}>{presentCount}</Text>
        </View>
        <View style={[styles.summaryCard, styles.warningCard]}>
          <Text style={styles.summaryLabel}>Late</Text>
          <Text style={[styles.summaryValue, styles.lateText]}>{lateCount}</Text>
        </View>
        <View style={[styles.summaryCard, styles.dangerCard]}>
          <Text style={styles.summaryLabel}>Absent</Text>
          <Text style={[styles.summaryValue, styles.absentText]}>{absentCount}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filter, overviewFilter === filter && styles.filterActive]}
            onPress={() => setOverviewFilter(filter)}
            accessibilityRole="button"
            accessibilityState={{ selected: overviewFilter === filter }}
          >
            <Text style={[styles.filterText, overviewFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Attendance overview</Text>
            <Text style={styles.sectionMeta}>{selectedDateRecords.length} records on {selectedDate}</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={exportAttendance} accessibilityRole="button">
            <Download size={15} color={colors.white} />
            <Text style={styles.exportButtonText}>{t('export')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.customDateFilter} onPress={openDatePicker} accessibilityRole="button">
            <CalendarDays size={16} color="#0f172a" />
            <Text style={styles.customDateText}>{selectedDate}</Text>
            <ChevronDown size={16} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.customDateButton} onPress={openDatePicker} accessibilityRole="button">
            <Text style={styles.customDateButtonText}>Custom</Text>
          </TouchableOpacity>
          {(selectedDate !== todayISO || rangeFilter !== 'Daily' || overviewFilter !== 'All') && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={resetFilters} accessibilityRole="button">
              <Text style={styles.clearFilterButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker ? (
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerCard}>
              <Text style={styles.datePickerTitle}>Choose date</Text>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (date) {
                    setDatePickerValue(date);
                  }
                }}
              />
              <View style={styles.datePickerActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDatePicker(false)} accessibilityRole="button">
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={confirmDateSelection} accessibilityRole="button">
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {filteredRecords.length ? (
          <View style={styles.listWrap}>
            {filteredRecords.map(record => {
              const meta = getStatusMeta(record.status);
              const Icon = meta.icon;

              return (
                <View key={record.id} style={[styles.recordCard, meta.tint]}>
                  <View style={styles.recordIconWrap}>
                    <Icon size={18} color={meta.iconColor} />
                  </View>

                  <View style={styles.recordContent}>
                    <Text style={styles.recordDate}>{record.date}</Text>
                    <Text style={styles.recordMeta}>{record.timestamp} - {record.checkOut}</Text>
                    <Text style={styles.recordMeta}>Duration: {record.totalHours}</Text>
                  </View>

                  <View style={styles.recordStatusWrap}>
                    <View style={[styles.statusDot, meta.dot]} />
                    <Text style={[styles.recordStatus, record.status === 'Present' ? styles.presentStatus : record.status === 'Late' ? styles.lateStatus : styles.absentStatus]}>{meta.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyText}>There are no {overviewFilter.toLowerCase()} records for this period.</Text>
          </View>
        )}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Monthly overview</Text>
        <Text style={styles.noteText}>{absentCount} absent day{absentCount === 1 ? '' : 's'} recorded in this period.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  eyebrow: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dateText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryCardActive: {
    borderWidth: 2,
  },
  goalCard: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  warningCard: {
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  dangerCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#172033',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  presentText: { color: '#047857' },
  lateText: { color: '#b45309' },
  absentText: { color: '#b91c1c' },
  recordsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionMeta: {
    color: '#667085',
    fontSize: 12,
    marginTop: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16856B',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  customDateFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customDateText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  customDateButton: {
    backgroundColor: '#16856B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customDateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  clearFilterButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dfe7ee',
  },
  clearFilterButtonText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  datePickerModal: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  datePickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePickerTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#16856B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  rangeButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
  },
  rangeButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  rangeButtonTextActive: {
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  filterActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listWrap: {
    marginTop: spacing.md,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  presentTint: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  lateTint: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  absentTint: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  recordIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  recordDate: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '800',
  },
  recordMeta: {
    color: '#667085',
    fontSize: 12,
    marginTop: 3,
  },
  recordStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  presentDot: { backgroundColor: '#10b981' },
  lateDot: { backgroundColor: '#f59e0b' },
  absentDot: { backgroundColor: '#ef4444' },
  recordStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  presentStatus: { color: '#047857' },
  lateStatus: { color: '#b45309' },
  absentStatus: { color: '#b91c1c' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    marginTop: spacing.xs,
  },
  noteCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 18,
    padding: spacing.md,
  },
  noteTitle: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '800',
  },
  noteText: {
    color: '#334155',
    fontSize: 13,
    marginTop: 4,
  },
});

export default EmployeeAttendance;
