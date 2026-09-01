import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ban, Edit3, Filter, Mail, MessageCircle, Plus, Search, Trash2, Users, X } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useData } from '../context/DataContext';

const AdminEmployees = () => {
  const { employees, addEmployee, updateEmployee } = useData();
  const [filterText, setFilterText] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [removedEmployees, setRemovedEmployees] = useState([]);
  const [bannedEmployees, setBannedEmployees] = useState([]);

  // Modal Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpStatus, setNewEmpStatus] = useState(true); // true = Active

  // Custom Dialog State
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'alert',
    actionText: '',
    actionType: 'primary',
    onConfirm: null
  });

  const showDialog = (title, message, type = 'alert', actionText = 'OK', actionType = 'primary', onConfirm = null) => {
    setDialog({ visible: true, title, message, type, actionText, actionType, onConfirm });
  };
  const closeDialog = () => setDialog(prev => ({ ...prev, visible: false }));

  const openAddModal = () => {
    setEditingEmployee(null);
    setNewEmpId('');
    setNewEmpName('');
    setNewEmpDept('');
    setNewEmpStatus(true);
    setShowAddModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setNewEmpId(employee.matricule);
    setNewEmpName(employee.name);
    setNewEmpDept(employee.department);
    setNewEmpStatus(employee.status === 'Active');
    setShowAddModal(true);
  };

  const confirmDelete = (employee) => {
    showDialog(
      'Delete Employee',
      `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
      'confirm',
      'Delete',
      'danger',
      () => setRemovedEmployees(current => [...current, employee.id])
    );
  };

  const confirmBan = (employee, isBanned) => {
    showDialog(
      isBanned ? 'Unban Employee' : 'Ban Employee',
      `Are you sure you want to ${isBanned ? 'unban' : 'ban'} ${employee.name}?`,
      'confirm',
      isBanned ? 'Unban' : 'Ban',
      isBanned ? 'primary' : 'warning',
      () => setBannedEmployees(current => isBanned ? current.filter(id => id !== employee.id) : [...current, employee.id])
    );
  };

  const handleSaveEmployee = () => {
    if (!newEmpId || !newEmpName || !newEmpDept) {
      showDialog('Missing Fields', 'Please fill all required fields.', 'alert');
      return;
    }
    
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        matricule: newEmpId,
        name: newEmpName,
        department: newEmpDept,
        status: newEmpStatus ? 'Active' : 'Inactive'
      });
      showDialog('Success', 'Employee updated successfully.', 'alert');
    } else {
      addEmployee({
        matricule: newEmpId,
        name: newEmpName,
        department: newEmpDept,
        role: 'Staff',
        email: `${newEmpName.split(' ')[0].toLowerCase()}@attendance.com`,
        phone: '+1 234 567 8900',
        status: newEmpStatus ? 'Active' : 'Inactive',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmpName)}&background=1e293b&color=fff&size=150`,
      });
      showDialog('Success', 'Employee added successfully.', 'alert');
    }
    
    setShowAddModal(false);
  };

  const applyFilter = () => {
    setAppliedFilter(filterText.trim());
  };

  const visibleEmployees = employees
    .filter(employee => !removedEmployees.includes(employee.id))
    .filter(employee => {
      const query = appliedFilter.toLowerCase();
      if (!query) return true;
      return [employee.name, employee.matricule, employee.role, employee.department, employee.email, employee.phone]
        .some(value => value?.toLowerCase().includes(query));
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.slate[400]} />
          <TextInput 
            style={styles.searchInput} 
            value={filterText} 
            onChangeText={(text) => {
              setFilterText(text);
              if (text === '') setAppliedFilter('');
            }}
            onSubmitEditing={applyFilter}
            placeholder="Search employees..." 
            placeholderTextColor={colors.slate[400]} 
            returnKeyType="search"
          />
          {filterText.length > 0 && (
            <TouchableOpacity style={styles.filterBtn} onPress={applyFilter}>
              <Text style={styles.filterBtnText}>Search</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Employees ({visibleEmployees.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Plus size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {visibleEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.slate[300]} />
            <Text style={styles.emptyText}>No employees found.</Text>
          </View>
        ) : (
          visibleEmployees.map(employee => {
            const isBanned = bannedEmployees.includes(employee.id);
            return (
              <View key={employee.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=1e293b&color=fff&size=150` }} style={styles.avatar} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.empName}>{employee.name}</Text>
                    <Text style={styles.empRole}>{employee.role} • {employee.department}</Text>
                    <Text style={styles.empId}>{employee.matricule}</Text>
                  </View>
                  <View style={[styles.statusPill, isBanned ? styles.bannedPill : employee.status === 'Active' ? styles.activePill : styles.inactivePill]}>
                    <Text style={[styles.statusText, isBanned ? styles.bannedText : employee.status === 'Active' ? styles.activeText : styles.inactiveText]}>
                      {isBanned ? 'Banned' : employee.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContact}>
                  <View style={styles.contactItem}>
                    <MessageCircle size={14} color={colors.slate[500]} />
                    <Text style={styles.contactText}>{employee.phone}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Mail size={14} color={colors.slate[500]} />
                    <Text style={styles.contactText}>{employee.email}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(employee)}>
                    <Edit3 size={16} color={colors.slate[600]} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmBan(employee, isBanned)}>
                    <Ban size={16} color={isBanned ? colors.pink[700] : colors.orange[600]} />
                    <Text style={[styles.actionBtnText, {color: isBanned ? colors.pink[700] : colors.orange[600]}]}>{isBanned ? 'Unban' : 'Ban'}</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(employee)}>
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={[styles.actionBtnText, {color: colors.danger}]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Employee Modal */}
      <Modal visible={showAddModal} animationType="none" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Employee ID</Text>
                <TextInput style={styles.input} value={newEmpId} onChangeText={setNewEmpId} placeholder="e.g. EMP001" placeholderTextColor={colors.slate[400]} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={newEmpName} onChangeText={setNewEmpName} placeholder="e.g. Jane Doe" placeholderTextColor={colors.slate[400]} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput style={styles.input} value={newEmpDept} onChangeText={setNewEmpDept} placeholder="e.g. Engineering" placeholderTextColor={colors.slate[400]} />
              </View>


              <View style={styles.switchGroup}>
                <Text style={styles.label}>Active Status</Text>
                <Switch 
                  value={newEmpStatus} 
                  onValueChange={setNewEmpStatus} 
                  trackColor={{ false: colors.slate[300], true: colors.pink[800] }} 
                  thumbColor={colors.white}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEmployee}>
                <Text style={styles.saveBtnText}>Save Employee</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Action Dialog */}
      <Modal visible={dialog.visible} animationType="none" transparent={true} onRequestClose={closeDialog}>
        <TouchableOpacity style={styles.dialogBackdrop} activeOpacity={1} onPress={closeDialog}>
          <TouchableOpacity style={styles.dialogCard} activeOpacity={1}>
            <Text style={styles.dialogTitle}>{dialog.title}</Text>
            <Text style={styles.dialogMessage}>{dialog.message}</Text>
            
            <View style={styles.dialogActions}>
              {dialog.type === 'confirm' && (
                <TouchableOpacity style={styles.dialogCancelBtn} onPress={closeDialog}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[
                  styles.dialogActionBtn, 
                  dialog.actionType === 'danger' ? styles.dialogDangerBtn : 
                  dialog.actionType === 'warning' ? styles.dialogWarningBtn : 
                  styles.dialogPrimaryBtn
                ]} 
                onPress={() => {
                  if (dialog.onConfirm) dialog.onConfirm();
                  closeDialog();
                }}
              >
                <Text style={styles.dialogActionText}>{dialog.actionText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.slate[900],
  },
  filterBtn: {
    backgroundColor: colors.pink[800],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[900],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pink[800],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.slate[500],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.slate[100],
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[900],
  },
  empRole: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 2,
  },
  empId: {
    fontSize: 12,
    color: colors.slate[400],
    marginTop: 2,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  activePill: {
    backgroundColor: '#ECFDF5',
  },
  inactivePill: {
    backgroundColor: colors.slate[100],
  },
  bannedPill: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: colors.slate[600],
  },
  bannedText: {
    color: colors.danger,
  },
  cardContact: {
    backgroundColor: colors.slate[50],
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactText: {
    fontSize: 13,
    color: colors.slate[600],
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    paddingTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[600],
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.slate[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate[900],
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[700],
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
    color: colors.slate[900],
    backgroundColor: colors.slate[50],
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.pink[800],
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 56,
    backgroundColor: colors.pink[50],
  },
  photoCaptureText: {
    color: colors.pink[800],
    fontWeight: '600',
    fontSize: 15,
  },
  photoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoSuccessText: {
    color: colors.green[700],
    fontWeight: '600',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.slate[100],
  },
  cancelBtnText: {
    color: colors.slate[700],
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.pink[800],
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialogCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 14,
    color: colors.slate[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.slate[100],
  },
  dialogCancelText: {
    color: colors.slate[700],
    fontWeight: '600',
    fontSize: 14,
  },
  dialogActionBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dialogPrimaryBtn: {
    backgroundColor: colors.pink[800],
  },
  dialogDangerBtn: {
    backgroundColor: colors.danger,
  },
  dialogWarningBtn: {
    backgroundColor: colors.orange[500],
  },
  dialogActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

});

export default AdminEmployees;
