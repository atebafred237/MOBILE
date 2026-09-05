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
import { Ban, Building2, Check, ChevronDown, Edit3, Mail, MessageCircle, Monitor, Plus, Trash2, Users, X } from 'lucide-react-native';
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
  const { user, token } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentModal, setDepartmentModal] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [employeePosition, setEmployeePosition] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [kioskModal, setKioskModal] = useState(false);
  const [kioskName, setKioskName] = useState('');
  const [kioskLocation, setKioskLocation] = useState('');
  const [kiosks, setKiosks] = useState([]);
  const [loadingKiosks, setLoadingKiosks] = useState(false);
  const [savingKiosk, setSavingKiosk] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [bannedEmployees, setBannedEmployees] = useState([]);

  const availableDepartments = useMemo(() => {
    const values = [
      ...departments,
      ...employees
        .map(employee => employee.department)
        .filter(Boolean),
    ];

    return Array.from(new Set(values.map(value => String(value).trim()).filter(Boolean)));
  }, [departments, employees]);

  useEffect(() => {
    const loadDepartments = async () => {
      const saved = await AsyncStorage.getItem(DEPARTMENTS_KEY);
      if (saved) setDepartments(JSON.parse(saved));

      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not load departments.');
        setDepartments((payload.data || []).map(department => department.name));
      } catch (error) {
        console.warn('Could not load departments from API:', error);
      }
    };
    loadDepartments();
  }, [token]);

  useEffect(() => {
    if (departments.length) {
      AsyncStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
    }
  }, [departments]);

  useEffect(() => {
    if (!departments.length && availableDepartments.length) {
      setDepartments(availableDepartments);
    }
  }, [availableDepartments, departments.length]);

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

  const createDepartment = async () => {
    const name = departmentName.trim();
    if (!name) return;
    if (departments.some(department => department.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Department exists', 'That department has already been added.');
      return;
    }
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/departments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not create department.');
      setDepartments(current => [...current, payload.data.name]);
    } catch (error) {
      Alert.alert('Department error', error.message);
      return;
    }
    setDepartmentName('');
    setDepartmentModal(false);
  };

  const openEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeCode('');
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeeDepartment(selectedDepartment === 'all' ? availableDepartments[0] || '' : selectedDepartment);
    setEmployeePosition('');
    setEmployeeModal(true);
  };

  const saveEmployee = async () => {
    if (!employeeCode.trim() || !employeeName.trim() || !employeeEmail.trim() || !employeeDepartment || !employeePosition.trim()) {
      Alert.alert('Missing fields', 'Employee ID, full name, email, department, and position are required.');
      return;
    }
    const fields = {
      matricule: employeeCode.trim(),
      name: employeeName.trim(),
      email: employeeEmail.trim().toLowerCase(),
      department: employeeDepartment,
      position: employeePosition.trim(),
    };
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, fields);
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/employees`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_code: fields.matricule,
            full_name: fields.name,
            email: fields.email,
            department: fields.department,
            position: fields.position,
            status: 'active',
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Could not create employee.');
        const created = payload.employee;
        addEmployee({
          id: created.id,
          matricule: created.employee_code,
          name: created.full_name,
          department: created.department,
          role: created.position,
          email: fields.email,
          phone: '',
          status: 'Active',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(created.full_name)}&background=1e293b&color=fff&size=150`,
        });
        Alert.alert('Employee created', 'The temporary password is password123. The employee must change it after signing in.');
      } catch (error) {
        Alert.alert('Employee error', error.message);
        return;
      }
    }
    setEditingEmployee(null);
    setEmployeeModal(false);
  };

  const toggleEmployeeStatus = () => {
    if (!selectedEmployee) return;
    const status = selectedEmployee.status === 'Active' ? 'Inactive' : 'Active';
    updateEmployee(selectedEmployee.id, { status });
    setSelectedEmployee({ ...selectedEmployee, status });
  };

  const toggleEmployeeBan = () => {
    if (!selectedEmployee) return;
    const isBanned = bannedEmployees.includes(selectedEmployee.id);
    setBannedEmployees(current => isBanned
      ? current.filter(id => id !== selectedEmployee.id)
      : [...current, selectedEmployee.id]);
  };

  const editSelectedEmployee = () => {
    if (!selectedEmployee) return;
    setEmployeeCode(selectedEmployee.matricule || '');
    setEmployeeName(selectedEmployee.name || '');
    setEmployeeEmail(selectedEmployee.email || '');
    setEmployeeDepartment(selectedEmployee.department || '');
    setEmployeePosition(selectedEmployee.position || selectedEmployee.role || '');
    setEditingEmployee(selectedEmployee);
    setSelectedEmployee(null);
    setEmployeeModal(true);
  };

  const deleteSelectedEmployee = () => {
    if (!selectedEmployee) return;
    Alert.alert(
      'Delete employee',
      `Are you sure you want to delete ${selectedEmployee.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteEmployee(selectedEmployee.id); setSelectedEmployee(null); } },
      ]
    );
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
      {availableDepartments.length === 0 ? <Text style={styles.emptyText}>No departments yet. Add one above to organize employees.</Text> : availableDepartments.map(department => {
        const count = employees.filter(employee => employee.department === department).length;
        return <View key={department} style={styles.departmentCard}><View style={styles.listIcon}><Building2 size={19} color={colors.pink[800]} /></View><View style={styles.listCopy}><Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">{department}</Text><Text style={styles.listMeta} numberOfLines={1}>{count} employee{count === 1 ? '' : 's'}</Text></View><View style={styles.departmentStatus}><Check size={17} color={colors.green[600]} /></View></View>;
      })}
    </>
  );

  const renderEmployees = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, selectedDepartment === 'all' && styles.filterChipActive]} onPress={() => setSelectedDepartment('all')}><Text style={[styles.filterText, selectedDepartment === 'all' && styles.filterTextActive]}>All</Text></TouchableOpacity>
        {availableDepartments.map(department => <TouchableOpacity key={department} style={[styles.filterChip, selectedDepartment === department && styles.filterChipActive]} onPress={() => setSelectedDepartment(department)}><Text style={[styles.filterText, selectedDepartment === department && styles.filterTextActive]}>{department}</Text></TouchableOpacity>)}
      </ScrollView>
      <TouchableOpacity style={styles.primaryButton} onPress={openEmployeeModal} disabled={!availableDepartments.length}><Plus size={17} color={colors.white} /><Text style={styles.primaryButtonText}>Add employee to department</Text></TouchableOpacity>
      {visibleEmployees.map(employee => <TouchableOpacity key={employee.id} style={styles.listCard} activeOpacity={0.8} onPress={() => setSelectedEmployee(employee)}><Image source={{ uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=1e293b&color=fff&size=150` }} style={styles.avatar} /><View style={styles.listCopy}><Text style={styles.listTitle}>{employee.name}</Text><Text style={styles.listMeta}>{employee.matricule}  |  {employee.department || 'Unassigned'}</Text></View></TouchableOpacity>)}
      {!visibleEmployees.length && <Text style={styles.emptyText}>{availableDepartments.length ? 'No employees in this department.' : 'Create a department before adding employees.'}</Text>}
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

      <Modal visible={!!selectedEmployee} transparent animationType="slide" onRequestClose={() => setSelectedEmployee(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailAvatarWrap}>
                <Image source={{ uri: selectedEmployee?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee?.name || 'User')}&background=1e293b&color=fff&size=150` }} style={styles.detailAvatar} />
              </View>
              <View style={styles.listCopy}><Text style={styles.detailTitle}>{selectedEmployee?.name}</Text><Text style={styles.listMeta}>{selectedEmployee?.role || 'Staff'}  |  {selectedEmployee?.department || 'Unassigned'}</Text></View>
              <TouchableOpacity onPress={() => setSelectedEmployee(null)}><X size={21} color={colors.slate[500]} /></TouchableOpacity>
            </View>
            <View style={styles.infoTable}>
              {[
                ['Employee ID', selectedEmployee?.matricule],
                ['Department', selectedEmployee?.department || 'Unassigned'],
                ['Role', selectedEmployee?.role || 'Staff'],
                ['Email', selectedEmployee?.email || 'No email'],
                ['Phone', selectedEmployee?.phone || 'No phone'],
                ['Status', bannedEmployees.includes(selectedEmployee?.id) ? 'Banned' : selectedEmployee?.status || 'Inactive'],
              ].map(([label, value]) => <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || 'N/A'}</Text></View>)}
            </View>
            <View style={styles.detailActions}>
              <TouchableOpacity style={[styles.detailButton, styles.contactButton]} onPress={() => Alert.alert('Contact employee', `Call or message ${selectedEmployee?.name}.`)}><MessageCircle size={15} color={colors.white} /><Text style={styles.detailButtonText}>Contact</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.detailButton, styles.activateButton]} onPress={toggleEmployeeStatus}><Text style={styles.detailButtonText}>{selectedEmployee?.status === 'Active' ? 'Deactivate' : 'Activate'}</Text></TouchableOpacity>
            </View>
            <View style={styles.detailActions}>
              <TouchableOpacity style={[styles.detailButton, styles.banButton]} onPress={toggleEmployeeBan}><Ban size={15} color={colors.white} /><Text style={styles.detailButtonText}>{bannedEmployees.includes(selectedEmployee?.id) ? 'Unban' : 'Ban'}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.detailButton, styles.editButton]} onPress={editSelectedEmployee}><Edit3 size={15} color={colors.slate[700]} /><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.detailButton, styles.deleteButton]} onPress={deleteSelectedEmployee}><Trash2 size={15} color={colors.white} /><Text style={styles.detailButtonText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={employeeModal} transparent animationType="fade" onRequestClose={() => setEmployeeModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</Text><TouchableOpacity onPress={() => setEmployeeModal(false)}><X size={21} color={colors.slate[500]} /></TouchableOpacity></View><TextInput style={styles.input} value={employeeCode} onChangeText={setEmployeeCode} placeholder="Employee ID" placeholderTextColor={colors.slate[400]} /><TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholder="Full name" placeholderTextColor={colors.slate[400]} /><TextInput style={styles.input} value={employeeEmail} onChangeText={setEmployeeEmail} placeholder="Email address" placeholderTextColor={colors.slate[400]} autoCapitalize="none" keyboardType="email-address" /><TextInput style={styles.input} value={employeePosition} onChangeText={setEmployeePosition} placeholder="Position" placeholderTextColor={colors.slate[400]} /><Text style={styles.label}>Department</Text><TouchableOpacity style={styles.departmentField} onPress={() => setDepartmentPickerOpen(true)}><Text style={[styles.departmentFieldText, !employeeDepartment && styles.departmentPlaceholder]}>{employeeDepartment || 'Select a department'}</Text><ChevronDown size={18} color={colors.slate[500]} /></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={saveEmployee}><Text style={styles.primaryButtonText}>{editingEmployee ? 'Save changes' : 'Create employee'}</Text></TouchableOpacity></View></KeyboardAvoidingView>
      </Modal>

      <Modal visible={departmentPickerOpen} transparent animationType="fade" onRequestClose={() => setDepartmentPickerOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setDepartmentPickerOpen(false)}>
          <View style={styles.pickerCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select department</Text><TouchableOpacity onPress={() => setDepartmentPickerOpen(false)}><X size={21} color={colors.slate[500]} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableDepartments.map(department => <TouchableOpacity key={department} style={[styles.departmentOption, employeeDepartment === department && styles.departmentOptionActive]} onPress={() => { setEmployeeDepartment(department); setDepartmentPickerOpen(false); }}><Text style={[styles.departmentOptionText, employeeDepartment === department && styles.departmentOptionTextActive]}>{department}</Text>{employeeDepartment === department && <Check size={17} color={colors.pink[800]} />}</TouchableOpacity>)}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  departmentCard: { width: '100%', height: 76, minHeight: 76, maxHeight: 76, flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 11, backgroundColor: colors.white, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  departmentStatus: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.green[50] },
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
  detailOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(15,23,42,0.55)' },
  detailCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, gap: spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailAvatarWrap: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', borderWidth: 2, borderColor: colors.pink[100] },
  detailAvatar: { width: '100%', height: '100%' },
  detailTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '800' },
  infoTable: { borderWidth: 1, borderColor: colors.slate[200], borderRadius: 10, overflow: 'hidden', backgroundColor: colors.slate[50] },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate[200] },
  infoLabel: { flex: 1, color: colors.slate[500], fontSize: 12, fontWeight: '600' },
  infoValue: { flex: 1.2, color: colors.slate[800], fontSize: 12, fontWeight: '700', textAlign: 'right' },
  detailActions: { flexDirection: 'row', gap: spacing.sm },
  detailButton: { flex: 1, minHeight: 40, borderRadius: 9, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  contactButton: { backgroundColor: colors.primary[700] },
  activateButton: { backgroundColor: colors.green[600] },
  banButton: { backgroundColor: colors.orange[600] },
  editButton: { backgroundColor: colors.slate[200] },
  deleteButton: { backgroundColor: colors.danger },
  detailButtonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  editButtonText: { color: colors.slate[700], fontSize: 12, fontWeight: '700' },
  modalTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '800' },
  input: { height: 44, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 9, paddingHorizontal: 12, color: colors.slate[900], backgroundColor: colors.slate[50] },
  label: { color: colors.slate[700], fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  departmentField: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.slate[300], borderRadius: 9, paddingHorizontal: 12, backgroundColor: colors.slate[50] },
  departmentFieldText: { color: colors.slate[800], fontSize: 14, fontWeight: '600' },
  departmentPlaceholder: { color: colors.slate[400], fontWeight: '400' },
  pickerOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(15,23,42,0.45)' },
  pickerCard: { maxHeight: '70%', backgroundColor: colors.white, borderRadius: 14, padding: spacing.lg },
  departmentOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.slate[100], paddingHorizontal: spacing.sm },
  departmentOptionActive: { backgroundColor: colors.pink[50] },
  departmentOptionText: { color: colors.slate[700], fontSize: 14 },
  departmentOptionTextActive: { color: colors.pink[800], fontWeight: '700' },
});

export default AdminManagement;
