import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useData } from '../context/DataContext';

const STATUS_OPTIONS = ['All Statuses', 'Present', 'Late', 'Absent'];
const WEEKDAYS = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminAttendance = () => {
	const { attendance: rawAttendance } = useData();
	const attendance = React.useMemo(() => {
		return rawAttendance.map(a => {
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
				totalHours,
				authMethod: a.method || 'Facial Recognition',
				location: a.location || 'Main Office',
				avatar: a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || 'User')}&background=1e293b&color=fff&size=150`,
			};
		});
	}, [rawAttendance]);
	const [status, setStatus] = useState('All Statuses');
	const [selectedDay, setSelectedDay] = useState('All Days');
	const [searchText, setSearchText] = useState('');
	const [appliedSearch, setAppliedSearch] = useState('');
	const [openDropdown, setOpenDropdown] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 8;

	const filteredAttendance = attendance.filter(record => {
		const matchesStatus = status === 'All Statuses' || record.status === status;
		const dayName = new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
		const matchesDay = selectedDay === 'All Days' || dayName === selectedDay;
		const query = appliedSearch.toLowerCase();
		const matchesSearch = !query || [record.name, record.department, record.date, record.status, record.location]
			.some(value => value?.toLowerCase().includes(query));
		return matchesStatus && matchesDay && matchesSearch;
	});
	const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize));
	const paginatedAttendance = filteredAttendance.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	const applySearch = () => {
		setAppliedSearch(searchText.trim());
		setCurrentPage(1);
	};
	const goToPage = page => setCurrentPage(Math.min(Math.max(page, 1), totalPages));

	const renderDropdown = (type, options, selected, onSelect) => openDropdown === type ? (
		<View style={styles.dropdownMenu}>
			{options.map(option => (
				<TouchableOpacity key={option} style={styles.dropdownOption} onPress={() => { onSelect(option); setOpenDropdown(null); }}>
					<Text style={[styles.dropdownOptionText, selected === option && styles.dropdownOptionActive]}>{option}</Text>
				</TouchableOpacity>
			))}
		</View>
	) : null;

	const exportAttendance = () => {
		const header = ['Employee Name', 'Employee ID', 'Date', 'Check-in', 'Check-out', 'Duration', 'Status', 'Method', 'Location'];
		const rows = filteredAttendance.map(record => [
			record.name,
			`EMP-${String(record.employeeId).padStart(4, '0')}`,
			record.date,
			record.timestamp,
			record.checkOut,
			record.totalHours,
			record.status,
			record.authMethod,
			record.location
		]);
		
		const csv = [header, ...rows]
			.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
			.join('\n');

		if (Platform.OS === 'web') {
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'attendance-report.csv';
			link.click();
			URL.revokeObjectURL(url);
			return;
		}

		Alert.alert('Export Complete', 'The attendance report has been generated successfully.');
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<View style={styles.headingBlock}>
				<Text style={styles.title}>Attendance Log</Text>
				<Text style={styles.description}>Details of all employee check-in and check-out activity.</Text>
			</View>

			<TouchableOpacity style={styles.exportButton} onPress={exportAttendance}>
				<Download size={18} color={colors.white} />
				<Text style={styles.exportButtonText}>Export Report</Text>
			</TouchableOpacity>

			<View style={styles.controlsCard}>
				<Text style={styles.controlsTitle}>Filter attendance</Text>
				<View style={styles.controlRow}>
					<View style={styles.controlWrapper}>
						<TouchableOpacity style={styles.dropdownButton} onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
							<Text style={styles.dropdownButtonText}>{status}</Text><ChevronDown size={16} color={colors.slate[600]} />
						</TouchableOpacity>
						{renderDropdown('status', STATUS_OPTIONS, status, setStatus)}
					</View>
					<View style={styles.controlWrapper}>
						<TouchableOpacity style={styles.dropdownButton} onPress={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}>
							  <CalendarDays size={16} color={colors.slate[600]} /><Text style={styles.dropdownButtonText}>Custom{selectedDay !== 'All Days' ? `: ${selectedDay}` : ''}</Text><ChevronDown size={16} color={colors.slate[600]} />
						</TouchableOpacity>
						{renderDropdown('day', WEEKDAYS, selectedDay, setSelectedDay)}
					</View>
				</View>
				<View style={styles.searchWrapper}>
					<Search size={17} color={colors.slate[400]} />
					<TextInput
						style={styles.searchInput}
						value={searchText}
						onChangeText={setSearchText}
						onSubmitEditing={applySearch}
						placeholder="Search employee, date, or location"
						placeholderTextColor={colors.slate[400]}
						returnKeyType="search"
					/>
					<TouchableOpacity style={styles.searchButton} onPress={applySearch}>
						<Text style={styles.searchButtonText}>Search</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.logCard}>
				<View style={styles.logHeader}><Text style={styles.logTitle}>Attendance Records</Text><Text style={styles.recordCount}>{filteredAttendance.length} records</Text></View>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View style={styles.table}>
						<View style={styles.tableHeaderRow}>
							<Text style={[styles.tableHeaderText, styles.employeeColumn]}>Employee</Text>
							<Text style={styles.tableHeaderText}>Check-in</Text>
							<Text style={styles.tableHeaderText}>Check-out</Text>
							<Text style={styles.tableHeaderText}>Duration</Text>
							<Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
							<Text style={[styles.tableHeaderText, styles.methodColumn]}>Method</Text>
							<Text style={[styles.tableHeaderText, styles.locationColumn]}>Location</Text>
						</View>
						{paginatedAttendance.map(record => (
							<View key={record.id} style={styles.tableRow}>
								<View style={[styles.employeeCell, styles.employeeColumn]}>
									<Image 
										source={{ uri: record.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name || 'User')}&background=1e293b&color=fff&size=150` }} 
										style={styles.employeeAvatar} 
									/>
									<View><Text style={styles.employeeName}>{record.name}</Text><Text style={styles.employeeId}>EMP-{String(record.employeeId).padStart(4, '0')}</Text></View>
								</View>
								<Text style={styles.tableCell}>{record.timestamp}</Text>
								<Text style={styles.tableCell}>{record.checkOut}</Text>
								<Text style={styles.tableCell}>{record.totalHours}</Text>
								<View style={styles.statusColumn}><Text style={[styles.statusBadge, record.status === 'Present' ? styles.presentBadge : record.status === 'Late' ? styles.lateBadge : styles.absentBadge]}>{record.status}</Text></View>
								<Text style={[styles.tableCell, styles.methodColumn]} numberOfLines={2}>{record.authMethod}</Text>
								<Text style={[styles.tableCell, styles.locationColumn]} numberOfLines={2}>{record.location}</Text>
							</View>
						))}
					</View>
				</ScrollView>
				{!filteredAttendance.length && <Text style={styles.emptyText}>No attendance records match these filters.</Text>}
				<View style={styles.pagination}>
					<Text style={styles.paginationText}>{filteredAttendance.length ? `Page ${currentPage} of ${totalPages}` : 'No records found'}</Text>
					<View style={styles.paginationActions}>
						<TouchableOpacity style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]} onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1} accessibilityLabel="Previous attendance page"><ChevronLeft size={18} color={currentPage === 1 ? colors.slate[300] : colors.slate[700]} /></TouchableOpacity>
						<TouchableOpacity style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]} onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} accessibilityLabel="Next attendance page"><ChevronRight size={18} color={currentPage === totalPages ? colors.slate[300] : colors.slate[700]} /></TouchableOpacity>
					</View>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.slate[50] },
	content: { padding: spacing.md, paddingBottom: spacing.lg },
	headingBlock: { marginBottom: spacing.sm },
	title: { fontSize: 24, fontWeight: '700', color: colors.slate[900] },
	description: { fontSize: 14, color: colors.slate[500], marginTop: spacing.xs },
	exportButton: { width: '100%', minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.pink[800], borderRadius: 8, marginBottom: spacing.sm },
	exportButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
	controlsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, zIndex: 5 },
	controlsTitle: { color: colors.slate[800], fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
	controlRow: { flexDirection: 'row', gap: spacing.sm, zIndex: 5 },
	controlWrapper: { flex: 1, position: 'relative', zIndex: 6 },
	dropdownButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 8, paddingHorizontal: spacing.sm, backgroundColor: colors.slate[50] },
	dropdownButtonText: { flex: 1, color: colors.slate[700], fontSize: 12 },
	dropdownMenu: { position: 'absolute', top: 46, left: 0, right: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 8, elevation: 8, shadowColor: colors.black, shadowOpacity: 0.12, shadowRadius: 6, zIndex: 20 },
	dropdownOption: { paddingHorizontal: spacing.sm, paddingVertical: 10 },
	dropdownOptionText: { color: colors.slate[700], fontSize: 12 },
	dropdownOptionActive: { color: colors.pink[800], fontWeight: '700' },
	searchWrapper: { height: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 8, paddingLeft: spacing.sm, marginTop: spacing.xs, backgroundColor: colors.slate[50] },
	searchInput: { flex: 1, color: colors.slate[900], fontSize: 13 },
	searchButton: { height: 42, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate[700], borderTopRightRadius: 7, borderBottomRightRadius: 7 },
	searchButtonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
	logCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 12, paddingTop: spacing.md, paddingBottom: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.md },
	logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
	logTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '700' },
	recordCount: { color: colors.slate[500], fontSize: 12 },
	table: { minWidth: 975 },
	tableHeaderRow: { flexDirection: 'row', alignItems: 'center', minHeight: 38, paddingHorizontal: spacing.sm, backgroundColor: colors.slate[50], borderBottomWidth: 1, borderBottomColor: colors.slate[200] },
	tableHeaderText: { width: 110, color: colors.slate[500], fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
	tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
	employeeColumn: { width: 220 },
	employeeCell: { flexDirection: 'row', alignItems: 'center' },
	employeeAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: spacing.sm, backgroundColor: colors.slate[200] },
	employeeName: { maxWidth: 165, color: colors.slate[800], fontSize: 13, fontWeight: '700' },
	employeeId: { color: colors.slate[500], fontSize: 11, marginTop: 2 },
	tableCell: { width: 110, color: colors.slate[700], fontSize: 12, paddingRight: spacing.sm },
	statusColumn: { width: 110 },
	methodColumn: { width: 150 },
	locationColumn: { width: 95 },
	statusBadge: { fontSize: 10, fontWeight: '700' },
	presentBadge: { color: colors.green[700] },
	lateBadge: { color: colors.warning },
	absentBadge: { color: colors.danger },
	emptyText: { color: colors.slate[500], fontSize: 13, paddingVertical: spacing.md, textAlign: 'center' },
	pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate[100] },
	paginationText: { color: colors.slate[500], fontSize: 12 },
	paginationActions: { flexDirection: 'row', gap: spacing.sm },
	paginationButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate[300], borderRadius: 7 },
	disabledButton: { backgroundColor: colors.slate[50], borderColor: colors.slate[200] },
});

export default AdminAttendance;
