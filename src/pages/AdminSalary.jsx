import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, ChevronDown, DollarSign, Search } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { colors, spacing } from '../theme';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 8)}01`;
const money = value => `${Number(value || 0).toLocaleString()} FCFA`;
const dateLabel = value => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const display = value => value === null || value === undefined || value === '' ? '—' : value;
const periodOptions = { today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom Range' };
const formatDate = date => date.toISOString().slice(0, 10);
const defaultDates = period => {
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

export default function AdminSalary() {
  const { token } = useAuth();
  const { employees } = useData();
  const { isDark } = useTheme();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [openPicker, setOpenPicker] = useState(false);
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState({ salary_type: 'daily', rate: '', late_deduction: '', absence_deduction: '', late_deduction_type: 'fixed', absence_deduction_type: 'none', grace_period_minutes: '0', effective_from: monthStart() });
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(defaultDates('month').from);
  const [to, setTo] = useState(defaultDates('month').to);
  const [filterError, setFilterError] = useState('');
  const [saving, setSaving] = useState(false);
  const visibleEmployees = useMemo(() => employees.filter(employee => employee.name.toLowerCase().includes(search.toLowerCase())), [employees, search]);

  const load = async (employee, dates = { from, to }) => {
    if (!employee || !token) return;
    if (dates.from > dates.to) {
      setFilterError('From date must be on or before To date.');
      return;
    }
    setFilterError('');
    setSelected(employee); setLoading(true);
    try {
      const query = `?from=${dates.from}&to=${dates.to}`;
      const response = await fetch(`${API_BASE_URL}/admin/salaries/${employee.id}${query}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Could not load salary.');
      const detailsResponse = await fetch(`${API_BASE_URL}/admin/salaries/${employee.id}/details${query}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const detailsJson = await detailsResponse.json();
      if (!detailsResponse.ok) throw new Error(detailsJson.message || 'Could not load salary details.');
      setPayload({ ...json.data, summary: detailsJson.data.summary, details: detailsJson.data.details });
      const config = json.data.configuration;
      if (config) setForm({ salary_type: config.salary_type, rate: String(config.rate_minor ?? ''), late_deduction: String(config.late_deduction_minor ?? ''), absence_deduction: String(config.absence_deduction_minor ?? ''), late_deduction_type: config.late_deduction_type, absence_deduction_type: config.absence_deduction_type, grace_period_minutes: String(config.grace_period_minutes ?? 0), effective_from: config.effective_from?.slice(0, 10) || monthStart() });
    } catch (error) { Alert.alert('Salary', error.message); } finally { setLoading(false); }
  };

  useEffect(() => { if (!selected && employees[0]) load(employees[0]); }, [employees, selected]);

  const selectPeriod = value => {
    setPeriod(value);
    if (value !== 'custom') {
      const dates = defaultDates(value);
      setFrom(dates.from);
      setTo(dates.to);
    }
  };

  const applyFilters = () => load(selected || employees[0], { from, to });

  const resetFilters = () => {
    const dates = defaultDates('month');
    setPeriod('month');
    setFrom(dates.from);
    setTo(dates.to);
    setFilterError('');
    if (selected || employees[0]) load(selected || employees[0], dates);
  };

  const save = async () => {
    if (!selected || !token) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/salaries/${selected.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Could not save salary configuration.');
      Alert.alert('Salary saved', 'This configuration is effective from the selected date.');
      load(selected);
    } catch (error) { Alert.alert('Salary', error.message); } finally { setSaving(false); }
  };

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const c = { bg: isDark ? colors.slate[900] : colors.slate[50], card: isDark ? colors.slate[800] : colors.white, text: isDark ? colors.slate[100] : colors.slate[900], muted: isDark ? colors.slate[300] : colors.slate[500], border: isDark ? colors.slate[600] : colors.slate[200] };
  return <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
    <View style={styles.titleRow}><DollarSign size={23} color={colors.pink[800]} /><Text style={[styles.title, { color: c.text }]}>Manage Salary</Text></View>
    <Text style={[styles.caption, { color: c.muted }]}>Configure effective-dated employee salary rules.</Text>
    <View style={[{ borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm }, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>Filters</Text>
      <Text style={[styles.label, { color: c.muted }]}>Employee</Text>
    <View style={[styles.search, { backgroundColor: c.card, borderColor: c.border }]}><Search size={17} color={c.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search employees" placeholderTextColor={c.muted} style={[styles.searchInput, { color: c.text }]} /></View>
    <TouchableOpacity style={[styles.selector, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => setOpenPicker(value => !value)}><Text style={{ color: c.text, flex: 1 }}>{selected?.name || 'Select employee'}</Text><ChevronDown size={18} color={c.muted} /></TouchableOpacity>
    {openPicker && <View style={[styles.picker, { backgroundColor: c.card, borderColor: c.border }]}>{visibleEmployees.map(employee => <TouchableOpacity key={employee.id} style={styles.pickerRow} onPress={() => { setOpenPicker(false); load(employee); }}><Text style={{ color: c.text }}>{employee.name}</Text><Text style={{ color: c.muted, fontSize: 12 }}>{employee.matricule}</Text></TouchableOpacity>)}</View>}
      <Text style={[styles.label, { color: c.muted }]}>Period</Text>
      <View style={styles.choiceRow}>{Object.entries(periodOptions).map(([key, label]) => <TouchableOpacity key={key} style={[styles.choice, { borderColor: c.border }, period === key && styles.choiceActive]} onPress={() => selectPeriod(key)}><Text style={{ color: period === key ? colors.white : c.text, fontSize: 12 }}>{label}</Text></TouchableOpacity>)}</View>
      {period === 'custom' && <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 1 }}><Text style={[styles.label, { color: c.muted }]}>From</Text><TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border }]} /></View><View style={{ flex: 1 }}><Text style={[styles.label, { color: c.muted }]}>To</Text><TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border }]} /></View></View>}
      {!!filterError && <Text style={{ color: colors.danger, marginTop: spacing.sm, fontSize: 12 }}>{filterError}</Text>}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}><TouchableOpacity style={{ flex: 1, alignItems: 'center', backgroundColor: colors.pink[800], borderRadius: 9, padding: 12 }} onPress={applyFilters}><Text style={styles.saveText}>Apply Filters</Text></TouchableOpacity><TouchableOpacity style={[{ alignItems: 'center', borderWidth: 1, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12 }, { borderColor: c.border }]} onPress={resetFilters}><Text style={{ color: c.text, fontWeight: '700' }}>Reset</Text></TouchableOpacity></View>
    </View>
    <Text style={{ color: c.muted, fontSize: 12, marginBottom: spacing.sm }}>Employee: {selected?.name || 'None'} · Period: {periodOptions[period]} · {from} to {to}</Text>
    {loading ? <ActivityIndicator color={colors.pink[800]} style={styles.loader} /> : selected && <>
      <View style={[styles.card, { backgroundColor: c.card }]}><Text style={[styles.section, { color: c.text }]}>Salary Configuration</Text>
        <Text style={[styles.label, { color: c.muted }]}>Salary type</Text><View style={styles.choiceRow}>{['daily', 'hourly', 'monthly'].map(type => <TouchableOpacity key={type} style={[styles.choice, { borderColor: c.border }, form.salary_type === type && styles.choiceActive]} onPress={() => setField('salary_type', type)}><Text style={{ color: form.salary_type === type ? colors.white : c.text }}>{type}</Text></TouchableOpacity>)}</View>
        {['rate', 'late_deduction', 'absence_deduction', 'grace_period_minutes', 'effective_from'].map(field => <View key={field}><Text style={[styles.label, { color: c.muted }]}>{field.replaceAll('_', ' ')}</Text><TextInput value={form[field]} onChangeText={value => setField(field, value)} keyboardType={field === 'effective_from' ? 'default' : 'numeric'} placeholder={field === 'effective_from' ? 'YYYY-MM-DD' : '0'} placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border }]} /></View>)}
        <Text style={[styles.label, { color: c.muted }]}>Late deduction type</Text><View style={styles.choiceRow}>{['fixed', 'per_hour', 'per_minute'].map(type => <TouchableOpacity key={type} style={[styles.choice, { borderColor: c.border }, form.late_deduction_type === type && styles.choiceActive]} onPress={() => setField('late_deduction_type', type)}><Text style={{ color: form.late_deduction_type === type ? colors.white : c.text, fontSize: 12 }}>{type}</Text></TouchableOpacity>)}</View>
        <Text style={[styles.label, { color: c.muted }]}>Absence deduction type</Text><View style={styles.choiceRow}>{['none', 'fixed', 'daily_rate'].map(type => <TouchableOpacity key={type} style={[styles.choice, { borderColor: c.border }, form.absence_deduction_type === type && styles.choiceActive]} onPress={() => setField('absence_deduction_type', type)}><Text style={{ color: form.absence_deduction_type === type ? colors.white : c.text, fontSize: 12 }}>{type}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color={colors.white} /> : <><Check size={17} color={colors.white} /><Text style={styles.saveText}>Save configuration</Text></>}</TouchableOpacity>
      </View>
      {payload?.summary && <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.section, { color: c.text }]}>Salary Summary</Text>
        <View style={[styles.table, { borderColor: c.border }]}>
          <View style={[styles.tableHeader, { backgroundColor: isDark ? colors.slate[700] : colors.slate[100] }]}><Text style={[styles.tableHeaderText, { color: c.text }]}>Salary Summary</Text><Text style={[styles.tableHeaderText, styles.tableValue, { color: c.text }]}>Value</Text></View>
          {[['Gross Earned', money(payload.summary.gross_earned)], ['Late Deductions', money(payload.summary.late_deductions)], ['Absence Deductions', money(payload.summary.absence_deductions)], ['Total Deductions', money(payload.summary.total_deductions)], ['Net Earned', money(payload.summary.net_earned)], ['Worked Hours', `${display(payload.summary.worked_hours)}h`], ['Expected Working Days', payload.summary.expected_working_days], ['Present Days', payload.summary.present_days], ['Late Days', payload.summary.late_days], ['Absent Days', payload.summary.absent_days]].map(([label, value]) => <View key={label} style={[styles.tableRow, { borderTopColor: c.border }]}><Text style={[styles.tableLabel, { color: c.muted }]}>{label}</Text><Text style={[styles.tableValue, { color: c.text }]}>{value}</Text></View>)}
        </View>
      </View>}
      {payload?.details && <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.section, { color: c.text }]}>Daily Salary Breakdown</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.detailTable, { borderColor: c.border }]}>
            <View style={[styles.detailRow, styles.detailHeader, { backgroundColor: isDark ? colors.slate[700] : colors.slate[100] }]}>{['Date', 'Scheduled', 'Check-in', 'Check-out', 'Hours', 'Status', 'Late min', 'Gross', 'Late deduction', 'Absence deduction', 'Total deduction', 'Net'].map(label => <Text key={label} style={[styles.detailCell, styles.detailHeaderText, { color: c.text }]}>{label}</Text>)}</View>
            {payload.details.map(day => <View key={day.date} style={[styles.detailRow, { borderTopColor: c.border }]}>{[dateLabel(day.date), `${display(day.scheduled_start)}-${display(day.scheduled_end)}`, day.actual_check_in ? day.actual_check_in.slice(11, 16) : '—', day.actual_checkout ? day.actual_checkout.slice(11, 16) : '—', `${display(day.worked_hours)}h`, display(day.status), display(day.late_minutes), money(day.gross_earned), money(day.late_deduction), money(day.absence_deduction), money(day.total_deduction), money(day.net_earned)].map((value, index) => <Text key={`${day.date}-${index}`} style={[styles.detailCell, { color: c.text }]}>{value}</Text>)}</View>)}
          </View>
        </ScrollView>
      </View>}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: spacing.md, paddingBottom: 48 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, title: { fontSize: 22, fontWeight: '700' }, caption: { marginTop: 4, marginBottom: spacing.lg }, search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.sm }, searchInput: { flex: 1, padding: 11, fontSize: 14 }, selector: { flexDirection: 'row', alignItems: 'center', padding: 13, borderWidth: 1, borderRadius: 10, marginTop: spacing.sm }, picker: { borderWidth: 1, borderRadius: 10, marginTop: 4, overflow: 'hidden' }, pickerRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }, loader: { marginTop: spacing.xl }, card: { borderRadius: 12, padding: spacing.md, marginTop: spacing.md }, section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm }, label: { fontSize: 12, textTransform: 'capitalize', marginTop: spacing.sm, marginBottom: 4 }, input: { borderWidth: 1, borderRadius: 8, padding: 10 }, choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, choiceActive: { backgroundColor: colors.pink[800], borderColor: colors.pink[800] }, save: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: colors.pink[800], borderRadius: 9, padding: 13, marginTop: spacing.md }, saveText: { color: colors.white, fontWeight: '700' }, table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' }, tableHeader: { flexDirection: 'row', padding: 11 }, tableHeaderText: { flex: 1, fontSize: 12, fontWeight: '700' }, tableRow: { flexDirection: 'row', borderTopWidth: 1, padding: 10 }, tableLabel: { flex: 1, fontSize: 13 }, tableValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '700' }, detailTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', minWidth: 1060 }, detailRow: { flexDirection: 'row', borderTopWidth: 1 }, detailHeader: { borderTopWidth: 0 }, detailCell: { width: 92, padding: 9, fontSize: 11 }, detailHeaderText: { fontWeight: '700' } });
