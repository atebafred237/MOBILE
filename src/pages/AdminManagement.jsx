import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2, Check, Monitor, Plus, Users, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { API_BASE_URL } from '../config';

const DEPARTMENTS_KEY = 'presenza_admin_departments';
const TABS = [
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'kiosks', label: 'Kiosks', icon: Monitor },
];

const AdminManagement = () => {
  const { user } = useAuth();
  const { employees, addEmployee } = useData();
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentModal, setDepartmentModal] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [kioskModal, setKioskModal] = useState(false);
  const [kioskName, setKioskName] = useState('');
  const [kioskLocation, setKioskLocation] = useState('');
  const [kiosks, setKiosks] = useState([]);
  const [loadingKiosks, setLoadingKiosks] = useState(false);
  const [savingKiosk, setSavingKiosk] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      const saved = await AsyncStorage.getItem(DEPARTMENTS_KEY);
      if (saved) setDepartments(JSON.parse(saved));
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    if (departments.length) {
      AsyncStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
    }
  }, [departments]);

  useEffect(() => {
    if (activeTab !== 'kiosks' || !user?.token) return;

    const loadKiosks = async () => {
      setLoadingKiosks(true);
      try {
        const response = await fetch(`${API_BASE_URL}/admin/devices`, {
          headers: { Authorization: `Bearer ${user.token}`, Accept: 'application/json' },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load kiosks.');
        setKiosks(payload.data?.data ?? payload.data ?? []);
      } catch (error) {
        Alert.alert('Kiosk error', error.message);
      } finally {
        setLoadingKiosks(false);
      }
    };

    loadKiosks();
  }, [activeTab, user?.token]);

  const visibleEmployees = useMemo(() => {
    if (selectedDepartment === 'all') return employees;
    return employees.filter(employee => employee.department === selectedDepartment);
  }, [employees, selectedDepartment]);

  const createDepartment = () => {
    const name = departmentName.trim();
    if (!name) return;
    if (departments.some(department => department.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Department exists', 'That department has already been added.');
      return;
    }
    setDepartments(current => [...current, name]);
    setDepartmentName('');
    setDepartmentModal(false);
  };

  const openEmployeeModal = () => {
    setEmployeeCode('');
    setEmployeeName('');
    setEmployeeDepartment(selectedDepartment === 'all' ? departments[0] || '' : selectedDepartment);
    setEmployeeModal(true);
  };

  const saveEmployee = () => {
    if (!employeeCode.trim() || !employeeName.trim() || !employeeDepartment) {
      Alert.alert('Missing fields', 'Employee ID, name, and department are required.');
      return;
    }
    addEmployee({
      matricule: employeeCode.trim(),
      name: employeeName.trim(),
      department: employeeDepartment,
      role: 'Staff',
      email: `${employeeName.trim().split(' ')[0].toLowerCase()}@attendance.com`,
      phone: '',
      status: 'Active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName.trim())}&background=1e293b&color=fff&size=150`,
    });
    setEmployeeModal(false);
  };

  const registerKiosk = async () => {
    if (!kioskName.trim() || !user?.token) return;
    setSavingKiosk(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/devices/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_name: kioskName.trim(),
          device_type: 'face_recognition_kiosk',
          location: kioskLocation.trim() || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not register kiosk.');
      setKiosks(current => [payload.device, ...current]);
      setKioskModal(false);
      setKioskName('');
      setKioskLocation('');
      Alert.alert('Kiosk registered', `Save this API key now; it will not be shown again:\n\n${payload.plain_text_api_key}`);
    } catch (error) {
      Alert.alert('Kiosk error', error.message);
    } finally {
      setSavingKiosk(false);
    }
  };

  const renderDepartments = () => (
    <>
      <TouchableOpacity style={styles.primaryButton} onPress={() => { setDepartmentName(''); setDepartmentModal(true); }}><Plus size={17} color={colors.white} /><Text style={styles.primaryButtonText}>Add department</Text></TouchableOpacity>
      {departments.length === 0 ? <Text style={styles.emptyText}>No departments yet. Add one above to organize employees.</Text> : departments.map(department => {
        const count = employees.filter(employee => employee.department === department).length;
        return <View key={department} style={styles.listCard}><View style={styles.listIcon}><Building2 size={19} color={colors.pink[800]} /></View><View style={styles.listCopy}><Text style={styles.listTitle}>{department}</Text><Text style={styles.listMeta}>{count} employee{count === 1 ? '' : 's'}</Text></View><Check size={18} color={colors.green[600]} /></View>;
      })}
    </>
  );

  const renderEmployees = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, selectedDepartment === 'all' && styles.filterChipActive]} onPress={() => setSelectedDepartment('all')}><Text style={[styles.filterText, selectedDepartment === 'all' && styles.filterTextActive]}>All</Text></TouchableOpacity>
        {departments.map(department => <TouchableOpacity key={department} style={[styles.filterChip, selectedDepartment === department && styles.filterChipActive]} onPress={() => setSelectedDepartment(department)}><Text style={[styles.filterText, selectedDepartment === department && styles.filterTextActive]}>{department}</Text></TouchableOpacity>)}
      </ScrollView>
      <TouchableOpacity style={styles.primaryButton} onPress={openEmployeeModal} disabled={!departments.length}><Plus size={17} color={colors.white} /><Text style={styles.primaryButtonText}>Add employee to department</Text></TouchableOpacity>
      {visibleEmployees.map(employee => <View key={employee.id} style={styles.listCard}><Image source={{ uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=1e293b&color=fff&size=150` }} style={styles.avatar} /><View style={styles.listCopy}><Text style={styles.listTitle}>{employee.name}</Text><Text style={styles.listMeta}>{employee.matricule}  |  {employee.department || 'Unassigned'}</Text></View></View>)}
      {!visibleEmployees.length && <Text style={styles.emptyText}>{departments.length ? 'No employees in this department.' : 'Create a department before adding employees.'}</Text>}
    </>
  );

  const renderKiosks = () => (
    <>
      <TouchableOpacity style={styles.primaryButton} onPress={() => setKioskModal(true)}><Plus size={17} color={colors.white} /><Text style={styles.primaryButtonText}>Register kiosk</Text></TouchableOpacity>
      {loadingKiosks ? <ActivityIndicator color={colors.pink[800]} style={styles.loader} /> : kiosks.map(kiosk => <View key={kiosk.id} style={styles.listCard}><View style={styles.listIcon}><Monitor size={19} color={colors.orange[600]} /></View><View style={styles.listCopy}><Text style={styles.listTitle}>{kiosk.device_name}</Text><Text style={styles.listMeta}>{kiosk.location || 'No location'}  |  {kiosk.status || 'active'}</Text></View></View>)}
      {!loadingKiosks && !kiosks.length && <Text style={styles.emptyText}>No kiosks registered.</Text>}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Admin Management</Text><Text style={styles.subtitle}>Organize departments, employees, and kiosk access.</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map(tab => { const Icon = tab.icon; return <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}><Icon size={16} color={activeTab === tab.key ? colors.white : colors.slate[600]} /><Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text></TouchableOpacity>; })}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content}>{activeTab === 'departments' ? renderDepartments() : activeTab === 'employees' ? renderEmployees() : renderKiosks()}</ScrollView>

      <Modal visible={employeeModal} transparent animationType="fade" onRequestClose={() => setEmployeeModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Employee</Text><TouchableOpacity onPress={() => setEmployeeModal(false)}><X size={21} color={colors.slate[500]} /></TouchableOpacity></View><TextInput style={styles.input} value={employeeCode} onChangeText={setEmployeeCode} placeholder="Employee ID" placeholderTextColor={colors.slate[400]} /><TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholder="Full name" placeholderTextColor={colors.slate[400]} /><Text style={styles.label}>Department</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{departments.map(department => <TouchableOpacity key={department} style={[styles.filterChip, employeeDepartment === department && styles.filterChipActive]} onPress={() => setEmployeeDepartment(department)}><Text style={[styles.filterText, employeeDepartment === department && styles.filterTextActive]}>{department}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.primaryButton} onPress={saveEmployee}><Text style={styles.primaryButtonText}>Save employee</Text></TouchableOpacity></View></KeyboardAvoidingView>
      </Modal>

      <Modal visible={departmentModal} transparent animationType="fade" onRequestClose={() => setDepartmentModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Department</Text><TouchableOpacity onPress={() => setDepartmentModal(false)}><X size={21} color={colors.slate[500]} /></TouchableOpacity></View><TextInput style={styles.input} value={departmentName} onChangeText={setDepartmentName} placeholder="Department name" placeholderTextColor={colors.slate[400]} onSubmitEditing={createDepartment} autoFocus /><TouchableOpacity style={styles.primaryButton} onPress={createDepartment}><Text style={styles.primaryButtonText}>Save department</Text></TouchableOpacity></View></KeyboardAvoidingView>
      </Modal>

      <Modal visible={kioskModal} transparent animationType="fade" onRequestClose={() => setKioskModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Register Kiosk</Text><TouchableOpacity onPress={() => setKioskModal(false)}><X size={21} color={colors.slate[500]} /></TouchableOpacity></View><TextInput style={styles.input} value={kioskName} onChangeText={setKioskName} placeholder="Kiosk name" placeholderTextColor={colors.slate[400]} /><TextInput style={styles.input} value={kioskLocation} onChangeText={setKioskLocation} placeholder="Location (optional)" placeholderTextColor={colors.slate[400]} /><TouchableOpacity style={styles.primaryButton} onPress={registerKiosk} disabled={savingKiosk}>{savingKiosk ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Register kiosk</Text>}</TouchableOpacity></View></KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f5' },
  header: { padding: spacing.md, paddingBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 23, fontWeight: '800' },
  subtitle: { color: colors.slate[500], fontSize: 13, marginTop: 4 },
  tabs: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200] },
  tabActive: { backgroundColor: colors.pink[800], borderColor: colors.pink[800] },
  tabText: { color: colors.slate[600], fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.sm },
  createRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inlineInput: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 9, paddingHorizontal: 12, backgroundColor: colors.white, color: colors.slate[900] },
  iconButton: { width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[800] },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, paddingHorizontal: 14, backgroundColor: colors.pink[800], marginBottom: spacing.sm },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.slate[300], borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white, marginRight: 6 },
  filterChipActive: { backgroundColor: colors.pink[50], borderColor: colors.pink[800] },
  filterText: { color: colors.slate[600], fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.pink[800] },
  listCard: { width: '100%', height: 72, flexShrink: 0, flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 11, backgroundColor: colors.white },
  listIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50], marginRight: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate[800], marginRight: spacing.sm },
  avatarText: { color: colors.white, fontWeight: '800' },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { color: colors.slate[800], fontSize: 14, fontWeight: '700' },
  listMeta: { color: colors.slate[500], fontSize: 12, marginTop: 4 },
  emptyText: { color: colors.slate[500], fontSize: 13, textAlign: 'center', paddingVertical: spacing.xl },
  loader: { padding: spacing.md },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalCard: { backgroundColor: colors.white, borderRadius: 14, padding: spacing.lg, gap: spacing.sm },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '800' },
  input: { height: 44, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 9, paddingHorizontal: 12, color: colors.slate[900], backgroundColor: colors.slate[50] },
  label: { color: colors.slate[700], fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
});

export default AdminManagement;
