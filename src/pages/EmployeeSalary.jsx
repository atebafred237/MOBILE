import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const ranges = {
  today: { from: today(), to: today(), label: 'Today' },
  week: { from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), to: today(), label: 'This Week' },
  month: { from: monthStart(), to: today(), label: 'This Month' },
};

export default function EmployeeSalary() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [range, setRange] = useState('month');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const selected = ranges[range];
        const response = await fetch(`${API_BASE_URL}/employee/salary/details?from=${selected.from}&to=${selected.to}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
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
  }, [token, range]);

  const c = { bg: isDark ? colors.slate[900] : colors.slate[50], card: isDark ? colors.slate[800] : colors.white, text: isDark ? colors.slate[100] : colors.slate[900], muted: isDark ? colors.slate[300] : colors.slate[500], border: isDark ? colors.slate[600] : colors.slate[200] };
  const summary = payload?.summary;
  const summaryRows = [['Gross Earned', money(summary?.gross_earned)], ['Late Deductions', money(summary?.late_deductions)], ['Absence Deductions', money(summary?.absence_deductions)], ['Total Deductions', money(summary?.total_deductions)], ['Net Earned', money(summary?.net_earned)], ['Worked Hours', `${display(summary?.worked_hours)} hours`], ['Present Days', display(summary?.present_days)], ['Late Days', display(summary?.late_days)], ['Absent Days', display(summary?.absent_days)]];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}><WalletCards size={23} color={colors.pink[800]} /><Text style={[styles.title, { color: c.text }]}>My Salary</Text></View>
      <Text style={[styles.caption, { color: c.muted }]}>Your attendance-based earnings and deductions.</Text>
      <View style={styles.tabs}>{Object.entries(ranges).map(([key, item]) => <TouchableOpacity key={key} style={[styles.tab, { backgroundColor: c.card, borderColor: c.border }, range === key && styles.activeTab]} onPress={() => setRange(key)}><Text style={{ color: range === key ? colors.white : c.text }}>{item.label}</Text></TouchableOpacity>)}</View>
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
  container: { flex: 1 }, content: { padding: spacing.md, paddingBottom: 48 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, title: { fontSize: 22, fontWeight: '700' }, caption: { marginTop: 4, marginBottom: spacing.lg }, tabs: { flexDirection: 'row', gap: 8 }, tab: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1 }, activeTab: { backgroundColor: colors.pink[800], borderColor: colors.pink[800] }, loader: { marginTop: spacing.xl }, error: { color: colors.danger, marginTop: spacing.lg }, card: { borderRadius: 12, padding: spacing.md, marginTop: spacing.md }, period: { fontSize: 12, marginBottom: spacing.sm }, section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm }, summaryTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, padding: 10 }, label: { fontSize: 12 }, value: { fontSize: 14, fontWeight: '700' }, detailTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: spacing.sm }, detailTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', minWidth: 620 }, detailRow: { flexDirection: 'row', borderTopWidth: 1 }, detailHeader: { borderTopWidth: 0 }, detailCell: { width: 103, padding: 10, fontSize: 12 }, detailHeaderText: { fontWeight: '700' },
});