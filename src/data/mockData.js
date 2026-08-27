
// Massive generated mock dataset for functional testing

export const dashboardStats = {
  totalEmployees: { value: '1,284', change: '+12.5%', type: 'increase' },
  avgAttendance: { value: '94.2%', change: '-0.4%', type: 'decrease' },
  activeLocations: { value: '18', change: '+2', type: 'increase' },
  pendingAlerts: { value: '7', change: 'Stable', type: 'neutral' }
};

export const weeklyTrends = [
  { day: 'Mon', present: 140, late: 10 },
  { day: 'Tue', present: 145, late: 12 },
  { day: 'Wed', present: 142, late: 8 },
  { day: 'Thu', present: 150, late: 5 },
  { day: 'Fri', present: 148, late: 15 },
  { day: 'Sat', present: 60, late: 2 },
  { day: 'Sun', present: 45, late: 1 },
];

export const methodsOfEntry = [
  { method: 'Facial Recognition', percentage: 72, color: 'bg-blue-600' },
  { method: 'Mobile Application', percentage: 18, color: 'bg-indigo-500' },
  { method: 'Physical Security Key', percentage: 7, color: 'bg-orange-400' },
  { method: 'Manual/Override', percentage: 3, color: 'bg-red-500' },
];

export const downloadedReports = [
  { id: 'report-1', name: 'Monthly Attendance Report', format: 'PDF', size: '2.4 MB', date: new Date().toISOString(), status: 'Downloaded', content: 'A complete monthly summary of employee check-ins, check-outs, attendance status, and department performance.' },
  { id: 'report-2', name: 'Q2 Compliance Summary', format: 'XLSX', size: '1.1 MB', date: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'Downloaded', content: 'Quarterly compliance results covering verification accuracy, late arrivals, absences, and security controls.' },
  { id: 'report-3', name: 'Weekly Check-in Overview', format: 'CSV', size: '486 KB', date: new Date(Date.now() - 86400000 * 7).toISOString(), status: 'Downloaded', content: 'Weekly check-in activity by employee, including arrival time, location, authentication method, and duration.' },
  { id: 'report-4', name: 'Security Verification Audit', format: 'PDF', size: '3.8 MB', date: new Date(Date.now() - 86400000 * 12).toISOString(), status: 'Downloaded', content: 'Security verification audit with reviewed authentication events, exceptions, and administrator follow-up items.' },
  { id: 'report-5', name: 'Department Attendance Analysis', format: 'XLSX', size: '924 KB', date: new Date(Date.now() - 86400000 * 18).toISOString(), status: 'Downloaded', content: 'Department-level attendance analysis comparing presence, late check-ins, absences, and total recorded hours.' },
  { id: 'report-6', name: 'Employee Hours Export', format: 'CSV', size: '712 KB', date: new Date(Date.now() - 86400000 * 25).toISOString(), status: 'Downloaded', content: 'Export of employee working hours and attendance durations for payroll and operational review.' },
];

// Generate 45 employees for pagination testing
export const employees = Array.from({ length: 45 }).map((_, i) => ({
  id: i + 1,
  matricule: `EMP-00${i + 1}`,
  name: ['Sarah Jenkins', 'Marcus Thompson', 'David Chen', 'Elena Rodriguez', 'Robert Wilson', 'Alice Smith', 'John Doe', 'Emma Watson', 'Michael Brown', 'Sophia Lee'][i % 10] + (i > 9 ? ` ${i}` : ''),
  email: `user${i+1}@presencehub.com`,
  department: ['Operations', 'Engineering', 'Design', 'Sales', 'HR'][i % 5],
  role: ['Manager', 'Senior Engineer', 'UX Designer', 'Account Executive', 'HR Specialist'][i % 5],
  position: ['Manager', 'Senior', 'Staff', 'Junior'][i % 4],
  phone: `+1 (555) 123-45${i.toString().padStart(2, '0')}`,
  status: i % 15 === 0 ? 'Inactive' : 'Active',
  avatar: `https://i.pravatar.cc/150?u=${i + 1}`
}));

// Generate 100 attendance records for pagination and date range testing
const today = new Date();
export const allAttendance = Array.from({ length: 100 }).map((_, i) => {
  const date = new Date(today);
  date.setDate(date.getDate() - (i % 40)); // spread over last 40 days
  const isLate = i % 7 === 0;
  const isAbsent = i % 12 === 0;
  return {
    id: i + 1,
    employeeId: (i % 45) + 1,
    name: employees[i % 45].name,
    department: employees[i % 45].department,
    avatar: employees[i % 45].avatar,
    date: date.toISOString().split('T')[0],
    timestamp: isAbsent ? '---' : isLate ? '09:15 AM' : '08:30 AM',
    checkOut: isAbsent ? '---' : '05:30 PM',
    status: isAbsent ? 'Absent' : isLate ? 'Late' : 'Present',
    authMethod: ['Facial Recognition', 'Mobile App', 'QR Scan'][i % 3],
    location: 'Main Entrance',
    totalHours: isAbsent ? '0h' : isLate ? '8.2h' : '9.0h'
  };
});

export const adminNotifications = [
  { id: 1, type: 'Security', title: 'Security Alert', message: 'Multiple failed facial verifications at North Gate.', date: new Date().toISOString(), read: false },
  { id: 2, type: 'System', title: 'System Maintenance', message: 'Scheduled maintenance this weekend.', date: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: 3, type: 'Report', title: 'Report Generated', message: 'Monthly attendance report is ready for download.', date: new Date(Date.now() - 172800000).toISOString(), read: true },
  { id: 4, type: 'Attendance', title: 'Late Check-in Pattern', message: 'Late arrivals increased at the Main Entrance this week.', date: new Date(Date.now() - 259200000).toISOString(), read: false },
  { id: 5, type: 'Security', title: 'Access Review Complete', message: 'The weekly access review completed with no critical findings.', date: new Date(Date.now() - 345600000).toISOString(), read: true },
  { id: 6, type: 'System', title: 'System Health Check', message: 'All attendance services are operating normally.', date: new Date(Date.now() - 432000000).toISOString(), read: true },
];

export const employeeNotifications = [
  { id: 1, type: 'Attendance', title: 'Attendance Recorded', message: 'Checked in successfully at 08:30 AM.', date: new Date().toISOString(), read: false },
  { id: 2, type: 'Alert', title: 'Late Arrival', message: 'You were marked late yesterday.', date: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: 3, type: 'Attendance', title: 'Weekly Summary Ready', message: 'Your weekly attendance summary is now available.', date: new Date(Date.now() - 172800000).toISOString(), read: true },
  { id: 4, type: 'System', title: 'Profile Updated', message: 'Your employee profile information was updated successfully.', date: new Date(Date.now() - 259200000).toISOString(), read: true },
];
