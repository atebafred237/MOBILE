import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Search, Clock, MapPin, Fingerprint, X, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useData } from '../context/DataContext';

const STATUS_OPTIONS = ['All Statuses', 'Present', 'Late', 'Absent'];
const WEEKDAYS = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SpinnerCol = ({ data, selectedValue, onChange }) => {
	const ITEM_HEIGHT = 44;
	const scrollViewRef = React.useRef(null);

	React.useEffect(() => {
		const index = data.findIndex(d => d.value === selectedValue);
		if (index !== -1 && scrollViewRef.current) {
			setTimeout(() => scrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: false }), 50);
		}
	}, [data, selectedValue]);

	return (
		<View style={{ height: ITEM_HEIGHT * 5, flex: 1, overflow: 'hidden' }}>
			<ScrollView 
				ref={scrollViewRef}
				showsVerticalScrollIndicator={false}
				snapToInterval={ITEM_HEIGHT}
				decelerationRate="fast"
				onMomentumScrollEnd={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
					if (data[index]) onChange(data[index].value);
				}}
			>
				<View style={{ height: ITEM_HEIGHT * 2 }} />
				{data.map((item) => {
					const isSelected = item.value === selectedValue;
					return (
						<View key={item.value} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
							<Text style={{ fontSize: isSelected ? 20 : 16, color: isSelected ? colors.pink[800] : colors.slate[400], fontWeight: isSelected ? '700' : '500' }}>
								{item.label}
							</Text>
						</View>
					);
				})}
				<View style={{ height: ITEM_HEIGHT * 2 }} />
			</ScrollView>
			<View pointerEvents="none" style={{ position: 'absolute', top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT, width: '100%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.pink[100] }} />
		</View>
	);
};

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
				avatar: a.avatar || `https://i.pravatar.cc/150?u=${a.name || a.employeeId}`,
			};
		});
	}, [rawAttendance]);
	const [status, setStatus] = useState('All Statuses');
	const [selectedDay, setSelectedDay] = useState('All Days');
	const [customDate, setCustomDate] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [appliedSearch, setAppliedSearch] = useState('');
	const [openDropdown, setOpenDropdown] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const filteredAttendance = attendance.filter(record => {
		const matchesStatus = status === 'All Statuses' || record.status === status;
		const dayName = new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
		const matchesDay = selectedDay === 'All Days' || dayName === selectedDay;
		const matchesCustomDate = !customDate || record.date === customDate;
		const query = appliedSearch.toLowerCase();
		const matchesSearch = !query || [record.name, record.department, record.date, record.status, record.location]
			.some(value => value?.toLowerCase().includes(query));
		return matchesStatus && matchesDay && matchesCustomDate && matchesSearch;
	});

	const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize));
	const paginatedAttendance = filteredAttendance.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	const applySearch = () => {
		setAppliedSearch(searchText.trim());
		setCurrentPage(1);
	};
	const goToPage = page => setCurrentPage(Math.min(Math.max(page, 1), totalPages));

	const onDateChange = (event, date) => {
		if (Platform.OS === 'android') setShowDatePicker(false);
		if (date) {
			setCustomDate(date.toISOString().split('T')[0]);
			setSelectedDay('All Days');
			setCurrentPage(1);
		}
	};

	const renderDropdownModal = () => {
		if (!openDropdown) return null;
		const isStatus = openDropdown === 'status';
		const options = isStatus ? STATUS_OPTIONS : WEEKDAYS;
		const selected = isStatus ? status : selectedDay;
		const onSelect = isStatus ? setStatus : setSelectedDay;
		const title = isStatus ? 'Select Status' : 'Select Day';

		return (
			<Modal visible transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpenDropdown(null)} />
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{title}</Text>
							<TouchableOpacity onPress={() => setOpenDropdown(null)}>
								<X size={20} color={colors.slate[400]} />
							</TouchableOpacity>
						</View>
						<ScrollView style={{ maxHeight: 300 }}>
							{options.map(option => (
								<TouchableOpacity key={option} style={styles.modalOption} onPress={() => { onSelect(option); setOpenDropdown(null); }}>
									<Text style={[styles.modalOptionText, selected === option && styles.modalOptionTextActive]}>{option}</Text>
									{selected === option && <CheckCircle2 size={18} color={colors.pink[800]} />}
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	};

	const [tempCustomDate, setTempCustomDate] = useState(new Date());

	const renderCustomSpinner = () => {
		const daysInMonth = new Date(tempCustomDate.getFullYear(), tempCustomDate.getMonth() + 1, 0).getDate();
		const days = Array.from({ length: daysInMonth }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
		const months = Array.from({ length: 12 }, (_, i) => {
			const d = new Date(2000, i, 1);
			return { label: d.toLocaleString('default', { month: 'short' }), value: i };
		});
		const currentYear = new Date().getFullYear();
		const years = Array.from({ length: 10 }, (_, i) => ({ label: `${currentYear - 5 + i}`, value: currentYear - 5 + i }));

		return (
			<Modal visible transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
					<View style={[styles.calendarContainer, { padding: 0 }]}>
						<View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 0 }]}>
							<Text style={styles.modalTitle}>Choose Date</Text>
						</View>
						<View style={{ flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
							<SpinnerCol 
								data={months} 
								selectedValue={tempCustomDate.getMonth()} 
								onChange={(val) => {
									const newD = new Date(tempCustomDate);
									newD.setMonth(val);
									setTempCustomDate(newD);
								}} 
							/>
							<SpinnerCol 
								data={days} 
								selectedValue={tempCustomDate.getDate()} 
								onChange={(val) => {
									const newD = new Date(tempCustomDate);
									newD.setDate(val);
									setTempCustomDate(newD);
								}} 
							/>
							<SpinnerCol 
								data={years} 
								selectedValue={tempCustomDate.getFullYear()} 
								onChange={(val) => {
									const newD = new Date(tempCustomDate);
									newD.setFullYear(val);
									setTempCustomDate(newD);
								}} 
							/>
						</View>
						<View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.slate[100] }}>
							<TouchableOpacity style={{ flex: 1, padding: spacing.md, alignItems: 'center' }} onPress={() => setShowDatePicker(false)}>
								<Text style={{ fontSize: 16, color: colors.slate[500], fontWeight: '600' }}>Cancel</Text>
							</TouchableOpacity>
							<View style={{ width: 1, backgroundColor: colors.slate[100] }} />
							<TouchableOpacity style={{ flex: 1, padding: spacing.md, alignItems: 'center' }} onPress={() => {
								const dateStr = tempCustomDate.toISOString().split('T')[0];
								setCustomDate(dateStr);
								setSelectedDay('All Days');
								setCurrentPage(1);
								setShowDatePicker(false);
							}}>
								<Text style={{ fontSize: 16, color: colors.pink[800], fontWeight: '700' }}>Confirm</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.searchContainer}>
					<Search size={20} color={colors.slate[400]} />
					<TextInput
						style={styles.searchInput}
						value={searchText}
						onChangeText={(text) => {
							setSearchText(text);
							if (text === '') setAppliedSearch('');
						}}
						onSubmitEditing={applySearch}
						placeholder="Search employee, location..."
						placeholderTextColor={colors.slate[400]}
						returnKeyType="search"
					/>
					{searchText.length > 0 && (
						<TouchableOpacity style={styles.filterBtn} onPress={applySearch}>
							<Text style={styles.filterBtnText}>Search</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Attendance Logs ({filteredAttendance.length})</Text>
					<TouchableOpacity style={styles.exportButton} onPress={() => Alert.alert('Export Report', 'Attendance report export is ready.')}>
						<Download size={16} color={colors.pink[800]} />
						<Text style={styles.exportButtonText}>Export</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.filtersRow}>
					<View style={[styles.filterWrapper, { flex: 1 }]}>
						<TouchableOpacity style={styles.dropdownButton} onPress={() => setOpenDropdown('status')}>
							<Text style={styles.dropdownButtonText}>{status}</Text><ChevronDown size={14} color={colors.slate[600]} />
						</TouchableOpacity>
					</View>
					<View style={[styles.filterWrapper, { flex: 1 }]}>
						<TouchableOpacity style={styles.dropdownButton} onPress={() => setOpenDropdown('day')}>
							<Text style={styles.dropdownButtonText}>{selectedDay}</Text><ChevronDown size={14} color={colors.slate[600]} />
						</TouchableOpacity>
					</View>
					<View style={[styles.filterWrapper, { zIndex: 8, flex: 1 }]}>
						<TouchableOpacity 
							style={[styles.dropdownButton, customDate && { borderColor: colors.pink[800], backgroundColor: colors.pink[50] }]} 
							onPress={() => customDate ? setCustomDate(null) : setShowDatePicker(true)}
						>
							<CalendarDays size={14} color={customDate ? colors.pink[800] : colors.slate[600]} />
							<Text style={[styles.dropdownButtonText, customDate && { color: colors.pink[800], fontWeight: '600' }]} numberOfLines={1}>
								{customDate ? new Date(customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Custom'}
							</Text>
							{customDate && <X size={14} color={colors.pink[800]} />}
						</TouchableOpacity>
					</View>
				</View>

				{showDatePicker && (
					Platform.OS !== 'android' ? renderCustomSpinner() : (
						<DateTimePicker
							value={customDate ? new Date(customDate) : new Date()}
							mode="date"
							display="default"
							onChange={onDateChange}
						/>
					)
				)}

				{!filteredAttendance.length ? (
					<View style={styles.emptyState}>
						<CalendarDays size={48} color={colors.slate[300]} />
						<Text style={styles.emptyText}>No attendance records found.</Text>
					</View>
				) : (
					<View style={styles.listContainer}>
						{paginatedAttendance.map(record => (
							<View key={record.id} style={styles.card}>
								<View style={styles.cardHeader}>
									<Image source={{ uri: record.avatar }} style={styles.avatar} />
									<View style={styles.cardInfo}>
										<Text style={styles.empName}>{record.name}</Text>
										<Text style={styles.empDate}>
											{new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
										</Text>
									</View>
									<View style={[styles.statusPill, record.status === 'Present' ? styles.presentPill : record.status === 'Late' ? styles.latePill : styles.absentPill]}>
										<Text style={[styles.statusText, record.status === 'Present' ? styles.presentText : record.status === 'Late' ? styles.lateText : styles.absentText]}>
											{record.status}
										</Text>
									</View>
								</View>

								<View style={styles.cardDetails}>
									<View style={styles.detailRow}>
										<View style={styles.detailItem}>
											<Clock size={14} color={colors.slate[400]} />
											<Text style={styles.detailLabel}>In:</Text>
											<Text style={styles.detailValue}>{record.timestamp}</Text>
										</View>
										<View style={styles.detailItem}>
											<Clock size={14} color={colors.slate[400]} />
											<Text style={styles.detailLabel}>Out:</Text>
											<Text style={styles.detailValue}>{record.checkOut || '---'}</Text>
										</View>
									</View>
									
									<View style={styles.detailRow}>
										<View style={styles.detailItem}>
											<Fingerprint size={14} color={colors.slate[400]} />
											<Text style={styles.detailLabel}>Method:</Text>
											<Text style={styles.detailValue}>{record.authMethod}</Text>
										</View>
									</View>

									<View style={styles.detailRow}>
										<View style={styles.detailItem}>
											<MapPin size={14} color={colors.slate[400]} />
											<Text style={styles.detailLabel}>Location:</Text>
											<Text style={styles.detailValue}>{record.location}</Text>
										</View>
										{record.totalHours && (
											<View style={styles.detailItem}>
												<Text style={styles.detailLabel}>Total:</Text>
												<Text style={[styles.detailValue, {fontWeight: '700'}]}>{record.totalHours}</Text>
											</View>
										)}
									</View>
								</View>
							</View>
						))}
					</View>
				)}

				{filteredAttendance.length > 0 && (
					<View style={styles.pagination}>
						<Text style={styles.paginationText}>Page {currentPage} of {totalPages}</Text>
						<View style={styles.paginationActions}>
							<TouchableOpacity style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]} onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
								<ChevronLeft size={18} color={currentPage === 1 ? colors.slate[300] : colors.slate[700]} />
							</TouchableOpacity>
							<TouchableOpacity style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]} onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
								<ChevronRight size={18} color={currentPage === totalPages ? colors.slate[300] : colors.slate[700]} />
							</TouchableOpacity>
						</View>
					</View>
				)}
			</ScrollView>
			{renderDropdownModal()}
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
		marginBottom: spacing.md,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.slate[900],
	},
	exportButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.pink[50],
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		gap: 6,
		borderWidth: 1,
		borderColor: colors.pink[200],
	},
	exportButtonText: {
		color: colors.pink[800],
		fontWeight: '600',
		fontSize: 13,
	},
	filtersRow: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginBottom: spacing.lg,
	},
	filterWrapper: {
		flex: 1,
		position: 'relative',
	},
	dropdownButton: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 5,
		borderWidth: 1,
		borderColor: colors.slate[200],
		borderRadius: 10,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.white,
	},
	dropdownButtonText: {
		flex: 1,
		color: colors.slate[700],
		fontSize: 13,
		fontWeight: '500',
	},
	dropdownMenu: {
		position: 'absolute',
		top: 50,
		left: 0,
		right: 0,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.slate[200],
		borderRadius: 10,
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
	},
	dropdownOption: {
		paddingHorizontal: spacing.md,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.slate[100],
	},
	dropdownOptionText: {
		color: colors.slate[700],
		fontSize: 14,
	},
	dropdownOptionActive: {
		color: colors.pink[800],
		fontWeight: '700',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		marginTop: spacing.md,
		fontSize: 15,
		color: colors.slate[500],
	},
	listContainer: {
		gap: spacing.md,
	},
	card: {
		backgroundColor: colors.white,
		borderRadius: 16,
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
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.slate[100],
		marginRight: spacing.md,
	},
	cardInfo: {
		flex: 1,
	},
	empName: {
		fontSize: 15,
		fontWeight: '700',
		color: colors.slate[900],
	},
	empDate: {
		fontSize: 13,
		color: colors.slate[500],
		marginTop: 2,
	},
	statusPill: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	presentPill: {
		backgroundColor: '#ECFDF5',
	},
	latePill: {
		backgroundColor: '#FFFBEB',
	},
	absentPill: {
		backgroundColor: '#FEF2F2',
	},
	statusText: {
		fontSize: 11,
		fontWeight: '700',
	},
	presentText: {
		color: '#059669',
	},
	lateText: {
		color: '#D97706',
	},
	absentText: {
		color: '#DC2626',
	},
	cardDetails: {
		backgroundColor: colors.slate[50],
		borderRadius: 12,
		padding: spacing.md,
		gap: 10,
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	detailItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		flex: 1,
	},
	detailLabel: {
		fontSize: 13,
		color: colors.slate[500],
	},
	detailValue: {
		fontSize: 13,
		color: colors.slate[800],
		fontWeight: '500',
	},
	pagination: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: spacing.xl,
		paddingTop: spacing.md,
		borderTopWidth: 1,
		borderTopColor: colors.slate[200],
	},
	paginationText: {
		color: colors.slate[500],
		fontSize: 13,
		fontWeight: '500',
	},
	paginationActions: {
		flexDirection: 'row',
		gap: spacing.sm,
	},
	paginationButton: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: colors.slate[300],
		borderRadius: 8,
		backgroundColor: colors.white,
	},
	disabledButton: {
		backgroundColor: colors.slate[50],
		borderColor: colors.slate[200],
	},
	datePickerBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end',
	},
	datePickerContainer: {
		backgroundColor: colors.white,
		paddingBottom: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	datePickerHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.slate[200],
	},
	datePickerTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.slate[900],
	},
	datePickerDoneText: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.pink[800],
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: spacing.xl,
	},
	modalContent: {
		backgroundColor: colors.white,
		borderRadius: 16,
		width: '100%',
		maxWidth: 320,
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.slate[200],
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.slate[900],
	},
	modalOption: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.slate[100],
	},
	modalOptionText: {
		fontSize: 15,
		color: colors.slate[700],
	},
	modalOptionTextActive: {
		color: colors.pink[800],
		fontWeight: '600',
	},
	calendarContainer: {
		backgroundColor: colors.white,
		borderRadius: 16,
		padding: spacing.lg,
		width: '100%',
		maxWidth: 340,
	},
	calendarHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.lg,
	},
	calendarMonthText: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.slate[900],
	},
	calendarWeekRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
	},
	calendarWeekText: {
		width: 32,
		textAlign: 'center',
		fontSize: 13,
		fontWeight: '600',
		color: colors.slate[400],
	},
	calendarDaysGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	calendarDayCell: {
		width: '14.28%',
		aspectRatio: 1,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 16,
		marginBottom: 4,
	},
	calendarDaySelected: {
		backgroundColor: colors.pink[800],
	},
	calendarDayText: {
		fontSize: 14,
		color: colors.slate[700],
	},
	calendarDayTextSelected: {
		color: colors.white,
		fontWeight: '700',
	},
});

export default AdminAttendance;
