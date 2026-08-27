import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ban, ChevronLeft, ChevronRight, Edit3, Filter, MessageCircle, Plus, Search, Trash2, Users } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useData } from '../context/DataContext';

const AdminEmployees = () => {
  const { employees } = useData();
  const [filterText, setFilterText] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [removedEmployees, setRemovedEmployees] = useState([]);
  const [bannedEmployees, setBannedEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const applyFilter = () => {
    setAppliedFilter(filterText.trim());
    setCurrentPage(1);
  };
  const visibleEmployees = employees
    .filter(employee => !removedEmployees.includes(employee.id))
    .filter(employee => {
      const query = appliedFilter.toLowerCase();
      if (!query) return true;
      return [employee.name, employee.matricule, employee.role, employee.department, employee.email, employee.phone]
        .some(value => value?.toLowerCase().includes(query));
    });
  const totalPages = Math.max(1, Math.ceil(visibleEmployees.length / pageSize));
  const paginatedEmployees = visibleEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = page => setCurrentPage(Math.min(Math.max(page, 1), totalPages));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}><Users size={22} color={colors.pink[800]} /></View>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Employee Management</Text>
            <Text style={styles.description}>Manage personnels, roles, and view detailed profiles.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert('Add New Employee', 'The employee form is ready to be connected.')}>
          <Plus size={19} color={colors.white} />
          <Text style={styles.addButtonText}>Add New Employee</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterHeading}><Filter size={18} color={colors.slate[600]} /><Text style={styles.filterTitle}>Filter employees</Text></View>
        <View style={styles.filterRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={17} color={colors.slate[400]} />
            <TextInput style={styles.filterInput} value={filterText} onChangeText={setFilterText} placeholder="Search by name, role, or department" placeholderTextColor={colors.slate[400]} autoCapitalize="none" returnKeyType="search" onSubmitEditing={applyFilter} />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={applyFilter}><Text style={styles.filterButtonText}>Filter</Text></TouchableOpacity>
        </View>
        {appliedFilter ? <Text style={styles.filterStatus}>Showing results for â€œ{appliedFilter}â€</Text> : null}
      </View>

      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Employee Directory</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableHeaderText, styles.employeeColumn]}>Employee</Text>
              <Text style={styles.tableHeaderText}>Role / Dept</Text>
              <View style={styles.contactHeader}><MessageCircle size={14} color={colors.pink[900]} /><Text style={styles.tableHeaderText}>Contact</Text></View>
              <Text style={styles.tableHeaderText}>Email</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {paginatedEmployees.map(employee => {
              const isBanned = bannedEmployees.includes(employee.id);
              return (
                <View key={employee.id} style={styles.tableRow}>
                  <View style={[styles.employeeCell, styles.employeeColumn]}>
                    <Image source={{ uri: employee.avatar }} style={styles.employeeAvatar} />
                    <View><Text style={styles.employeeName}>{employee.name}</Text><Text style={styles.employeeId}>{employee.matricule}</Text></View>
                  </View>
                  <View style={styles.tableCell}><Text style={styles.cellText}>{employee.role}</Text><Text style={styles.cellMuted}>{employee.department}</Text></View>
                  <View style={styles.tableCell}><View style={styles.contactCell}><View style={styles.onlineDot} /><Text style={styles.cellText}>{employee.phone}</Text></View></View>
                  <View style={styles.tableCell}><Text style={styles.cellText}>{employee.email}</Text></View>
                  <View style={styles.tableCell}><Text style={[styles.statusBadge, isBanned ? styles.bannedBadge : employee.status === 'Active' ? styles.activeBadge : styles.inactiveBadge]}>{isBanned ? 'Banned' : employee.status}</Text></View>
                  <View style={[styles.actionCell, styles.tableCell]}>
                    <TouchableOpacity onPress={() => Alert.alert('Edit Employee', `Edit ${employee.name}`)} accessibilityLabel={`Edit ${employee.name}`}><Edit3 size={18} color={colors.slate[600]} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setRemovedEmployees(current => [...current, employee.id])} accessibilityLabel={`Delete ${employee.name}`}><Trash2 size={18} color={colors.danger} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setBannedEmployees(current => isBanned ? current.filter(id => id !== employee.id) : [...current, employee.id])} accessibilityLabel={`${isBanned ? 'Unban' : 'Ban'} ${employee.name}`}><Ban size={18} color={isBanned ? colors.pink[900] : colors.orange[600]} /></TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>{visibleEmployees.length ? `Page ${currentPage} of ${totalPages}` : 'No employees found'}</Text>
          <View style={styles.paginationActions}>
            <TouchableOpacity style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]} onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1} accessibilityLabel="Previous page"><ChevronLeft size={18} color={currentPage === 1 ? colors.slate[300] : colors.slate[700]} /></TouchableOpacity>
            <TouchableOpacity style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]} onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} accessibilityLabel="Next page"><ChevronRight size={18} color={currentPage === totalPages ? colors.slate[300] : colors.slate[700]} /></TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efeae2' }, content: { padding: spacing.md },
  header: { backgroundColor: colors.pink[900], borderRadius: 4, padding: spacing.md, marginBottom: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'center' }, headingIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.pink[50] }, headingCopy: { flex: 1, marginLeft: spacing.sm }, title: { fontSize: 19, fontWeight: '700', color: colors.white }, description: { fontSize: 13, lineHeight: 19, color: colors.pink[50], marginTop: spacing.xs },
  addButton: { width: '100%', minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: 8, marginTop: spacing.md }, addButtonText: { color: colors.pink[900], fontSize: 14, fontWeight: '700' },
  filterSection: { backgroundColor: colors.white, borderRadius: 4, padding: spacing.md }, filterHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }, filterTitle: { color: colors.pink[900], fontSize: 14, fontWeight: '700' }, filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, searchInputWrapper: { flex: 3, height: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: '#d9e2dc', borderRadius: 8, backgroundColor: '#f7faf8' }, filterInput: { flex: 1, color: colors.slate[900], fontSize: 13 }, filterButton: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.pink[900] }, filterButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' }, filterStatus: { color: colors.slate[500], fontSize: 12, marginTop: spacing.sm },
  tableCard: { marginTop: spacing.md, backgroundColor: colors.white, borderRadius: 4, padding: spacing.md }, tableTitle: { color: colors.pink[900], fontSize: 14, fontWeight: '700', marginBottom: spacing.sm }, table: { minWidth: 880 }, tableRowHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 38, backgroundColor: '#fdf2f8', borderBottomWidth: 1, borderBottomColor: '#fce7f3', paddingHorizontal: spacing.sm }, tableHeaderText: { width: 150, color: colors.pink[900], fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }, contactHeader: { width: 150, flexDirection: 'row', alignItems: 'center', gap: 4 }, tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#fdf2f8', paddingHorizontal: spacing.sm }, employeeColumn: { width: 210 }, employeeCell: { flexDirection: 'row', alignItems: 'center' }, employeeAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.slate[200], marginRight: spacing.sm }, employeeName: { color: colors.slate[900], fontSize: 13, fontWeight: '700', maxWidth: 155 }, employeeId: { color: colors.slate[500], fontSize: 11, marginTop: 2 }, tableCell: { width: 150, paddingRight: spacing.sm }, contactCell: { flexDirection: 'row', alignItems: 'center', gap: 6 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pink[900] }, cellText: { color: colors.slate[700], fontSize: 12 }, cellMuted: { color: colors.slate[500], fontSize: 11, marginTop: 3 }, statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden', fontSize: 11, fontWeight: '700' }, activeBadge: { color: colors.pink[900], backgroundColor: colors.pink[50] }, inactiveBadge: { color: colors.slate[600], backgroundColor: colors.slate[100] }, bannedBadge: { color: colors.danger, backgroundColor: '#fef2f2' }, actionCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate[100], marginTop: spacing.sm, paddingTop: spacing.sm }, paginationText: { color: colors.slate[500], fontSize: 12 }, paginationActions: { flexDirection: 'row', gap: spacing.sm }, paginationButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate[300], borderRadius: 7, backgroundColor: colors.white }, paginationButtonDisabled: { backgroundColor: colors.slate[50], borderColor: colors.slate[200] },
});

export default AdminEmployees;
