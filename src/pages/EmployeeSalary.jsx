import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CalendarDays, WalletCards } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { colors, spacing } from '../theme';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 8)}01`;
const money = value => `${Number(value || 0).toLocaleString()} FCFA`;
const display = value => value === null || value === undefined || value === '' ? '--' : value;
const dateLabel = value => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
const formatDate = date => date.toISOString().slice(0, 10);
const datesFor = period => {
  const current = new Date();
  if (period === 'today') return { from: formatDate(current), to: formatDate(current) };
  if (period === 'week') {
    const start = new Date(current);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: formatDate(start), to: formatDate(end) };
  }
  return { from: `${formatDate(current).slice(0, 8)}01`, to: formatDate(current) };
};

const ranges = {
  today: { from: today(), to: today(), label: 'Today' },
  week: { from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), to: today(), label: 'This Week' },
  month: { from: monthStart(), to: today(), label: 'This Month' },
};

export default function EmployeeSalary() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [range, setRange] = useState('month');
  const initialDates = datesFor('month');
  const [from, setFrom] = useState(initialDates.from);
  const [to, setTo] = useState(initialDates.to);
  const [appliedFrom, setAppliedFrom] = useState(initialDates.from);
  const [appliedTo, setAppliedTo] = useState(initialDates.to);
  const [filterError, setFilterError] = useState('');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/employee/salary/details?from=${appliedFrom}&to=${appliedTo}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Could not load salary.');
        setPayload(json.data);
      } catch (error) {
        setPayload({ error: error.message });
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, appliedFrom, appliedTo]);

  const selectPeriod = value => {
    setRange(value);
    if (value !== 'custom') {
      const dates = datesFor(value);
      setFrom(dates.from);
      setTo(dates.to);
    }
  };

  const applyFilters = () => {
    if (from > to) {
      setFilterError('From date must be on or before To date.');
      return;
    }
    setFilterError('');
    setAppliedFrom(from);
    setAppliedTo(to);
  };

  const resetFilters = () => {
    const dates = datesFor('month');
    setRange('month');
    setFrom(dates.from);
    setTo(dates.to);
    setFilterError('');
    setAppliedFrom(dates.from);
    setAppliedTo(dates.to);
  };

  const c = { bg: isDark ? colors.slate[900] : colors.slate[50], card: isDark ? colors.slate[800] : colors.white, text: isDark ? colors.slate[100] : colors.slate[900], muted: isDark ? colors.slate[300] : colors.slate[500], border: isDark ? colors.slate[600] : colors.slate[200] };
  const summary = payload?.summary;
  const summaryRows = [['Gross Earned', money(summary?.gross_earned)], ['Late Deductions', money(summary?.late_deductions)], ['Absence Deductions', money(summary?.absence_deductions)], ['Total Deductions', money(summary?.total_deductions)], ['Net Earned', money(summary?.net_earned)], ['Worked Hours', `${display(summary?.worked_hours)} hours`], ['Present Days', display(summary?.present_days)], ['Late Days', display(summary?.late_days)], ['Absent Days', display(summary?.absent_days)]];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}><WalletCards size={23} color={colors.pink[800]} /><Text style={[styles.title, { color: c.text }]}>My Salary</Text></View>
      <Text style={[styles.caption, { color: c.muted }]}>Your attendance-based earnings and deductions.</Text>
      <View style={styles.filterCard}><Text style={[styles.filterTitle, { color: c.text }]}>Filters</Text><View style={styles.tabs}>{Object.entries(ranges).map(([key, item]) => <TouchableOpacity key={key} style={[styles.tab, { backgroundColor: c.card, borderColor: c.border }, range === key && styles.activeTab]} onPress={() => selectPeriod(key)}><Text style={{ color: range === key ? colors.white : c.text }}>{item.label}</Text></TouchableOpacity>)}</View>{range === 'custom' && <View style={styles.dateRow}><View style={styles.dateField}><Text style={[styles.filterLabel, { color: c.muted }]}>From</Text><TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} style={[styles.dateInput, { color: c.text, borderColor: c.border }]} /></View><View style={styles.dateField}><Text style={[styles.filterLabel, { color: c.muted }]}>To</Text><TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} style={[styles.dateInput, { color: c.text, borderColor: c.border }]} /></View></View>}{!!filterError && <Text style={styles.filterError}>{filterError}</Text>}<View style={styles.filterActions}><TouchableOpacity style={styles.apply} onPress={applyFilters}><Text style={styles.actionText}>Apply Filters</Text></TouchableOpacity><TouchableOpacity style={[styles.reset, { borderColor: c.border }]} onPress={resetFilters}><Text style={{ color: c.text, fontWeight: '700' }}>Reset</Text></TouchableOpacity></View></View>
      {loading ? <ActivityIndicator color={colors.pink[800]} style={styles.loader} /> : payload?.error ? <Text style={styles.error}>{payload.error}</Text> : payload && <>
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.period, { color: c.muted }]}>{payload.period.from} to {payload.period.to}</Text>
          <Text style={[styles.section, { color: c.text }]}>Salary Summary</Text>
          <View style={[styles.summaryTable, { borderColor: c.border }]}>{summaryRows.map(([label, value]) => <View key={label} style={[styles.summaryRow, { borderTopColor: c.border }]}><Text style={[styles.label, { color: c.muted }]}>{label}</Text><Text style={[styles.value, { color: label === 'Net Earned' ? colors.green[600] : c.text }]}>{value}</Text></View>)}</View>
        </View>
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <View style={styles.detailTitle}><CalendarDays size={18} color={colors.pink[800]} /><Text style={[styles.section, { color: c.text }]}>Daily Breakdown</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={[styles.detailTable, { borderColor: c.border }]}>
            <View style={[styles.detailRow, styles.detailHeader, { backgroundColor: isDark ? colors.slate[700] : colors.slate[100] }]}>{['Date', 'Status', 'Hours', 'Gross', 'Deduction', 'Net'].map(label => <Text key={label} style={[styles.detailCell, styles.detailHeaderText, { color: c.text }]}>{label}</Text>)}</View>
            {payload.details.map(day => <View key={day.date} style={[styles.detailRow, { borderTopColor: c.border }]}>{[dateLabel(day.date), display(day.status), `${display(day.worked_hours)}h`, money(day.gross_earned), money(day.total_deduction), money(day.net_earned)].map((value, index) => <Text key={`${day.date}-${index}`} style={[styles.detailCell, { color: c.text }]}>{value}</Text>)}</View>)}
          </View></ScrollView>
        </View>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: spacing.md, paddingBottom: 48 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, title: { fontSize: 22, fontWeight: '700' }, caption: { marginTop: 4, marginBottom: spacing.lg }, filterCard: { borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm }, filterTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm }, tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tab: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1 }, activeTab: { backgroundColor: colors.pink[800], borderColor: colors.pink[800] }, dateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }, dateField: { flex: 1 }, filterLabel: { fontSize: 12, marginBottom: 4 }, dateInput: { borderWidth: 1, borderRadius: 8, padding: 10 }, filterError: { color: colors.danger, marginTop: spacing.sm, fontSize: 12 }, filterActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, apply: { flex: 1, alignItems: 'center', backgroundColor: colors.pink[800], borderRadius: 9, padding: 12 }, reset: { alignItems: 'center', borderWidth: 1, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12 }, actionText: { color: colors.white, fontWeight: '700' }, loader: { marginTop: spacing.xl }, error: { color: colors.danger, marginTop: spacing.lg }, card: { borderRadius: 12, padding: spacing.md, marginTop: spacing.md }, period: { fontSize: 12, marginBottom: spacing.sm }, section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm }, summaryTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, padding: 10 }, label: { fontSize: 12 }, value: { fontSize: 14, fontWeight: '700' }, detailTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: spacing.sm }, detailTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', minWidth: 620 }, detailRow: { flexDirection: 'row', borderTopWidth: 1 }, detailHeader: { borderTopWidth: 0 }, detailCell: { width: 103, padding: 10, fontSize: 12 }, detailHeaderText: { fontWeight: '700' },
});