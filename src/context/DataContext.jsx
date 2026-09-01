import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { token, user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [empNotifs, setEmpNotifs] = useState([]);
  const [reports, setReports] = useState([]);
  const [trash, setTrash] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  /* ─── Fetch from API whenever the user / token changes ─── */
  useEffect(() => {
    if (!token || !user) return;   // not logged in yet

    const load = async () => {
      setDataLoading(true);
      
      try {
        const savedReports = await AsyncStorage.getItem('ph_reports');
        if (savedReports) setReports(JSON.parse(savedReports));

        const savedTrash = await AsyncStorage.getItem('ph_trash');
        if (savedTrash) setTrash(JSON.parse(savedTrash));
      } catch (e) {
        console.warn('Could not load local reports/trash', e);
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      try {
        if (user.role === 'admin' || user.role === 'supervisor') {
          // ── Employees ──
          const empRes = await fetch(`${API_BASE_URL}/admin/employees`, { headers });
          if (empRes.ok) {
            const empJson = await empRes.json();
            const raw = empJson.data?.data ?? empJson.data ?? [];
            setEmployees(raw.map(e => ({
              id:         e.id,
              name:       e.full_name,
              role:       e.position ?? 'Staff',
              email:      e.user?.email ?? e.email ?? '',
              phone:      e.phone ?? '',
              department: e.department ?? '',
              position:   e.position ?? '',
              matricule:  e.employee_code ?? '',
              avatar:     e.profile_image ?? e.user?.profile_image ?? `https://i.pravatar.cc/150?u=${e.user?.email || e.id}`,
              status:     e.status === 'active' ? 'Active' : 'Inactive',
            })));
          } else {
            console.warn('Employees fetch failed:', empRes.status);
          }

          // ── Attendance ──
          const attRes = await fetch(`${API_BASE_URL}/admin/attendance`, { headers });
          if (attRes.ok) {
            const attJson = await attRes.json();
            const raw = attJson.data?.data ?? attJson.data ?? [];
            setAttendance(raw.map(a => ({
              id:         a.id,
              employeeId: a.employee_id,
              name:       a.employee?.full_name ?? '',
              date:       a.date ?? a.check_in_at?.split('T')[0],
              timeIn:     a.check_in_at,
              timeOut:    a.check_out_at,
              status:     a.status,
              method:     a.entry_method ?? 'manual',
            })));
          } else {
            console.warn('Attendance fetch failed:', attRes.status);
          }

          // ── Admin Notifications ──
          const notifRes = await fetch(`${API_BASE_URL}/admin/notifications`, { headers });
          if (notifRes.ok) {
            const notifJson = await notifRes.json();
            const raw = notifJson.data?.data ?? notifJson.data ?? [];
            setAdminNotifs(Array.isArray(raw) ? raw.map(n => ({
              id:      n.id,
              title:   n.title ?? n.type ?? 'Notification',
              message: n.message ?? n.data?.message ?? '',
              read:    !!n.read_at,
              time:    n.created_at,
            })) : []);
          } else {
            console.warn('Admin notifications fetch failed:', notifRes.status);
          }

        } else {
          // ── Employee: own attendance history ──
          const attRes = await fetch(`${API_BASE_URL}/employee/attendance/history`, { headers });
          if (attRes.ok) {
            const attJson = await attRes.json();
            const raw = attJson.data?.data ?? attJson.data ?? [];
            setAttendance(Array.isArray(raw) ? raw.map(a => ({
              id:      a.id,
              date:    a.date ?? a.check_in_at?.split('T')[0],
              timeIn:  a.check_in_at,
              timeOut: a.check_out_at,
              status:  a.status,
              method:  a.entry_method ?? 'manual',
            })) : []);
          } else {
            console.warn('Employee attendance fetch failed:', attRes.status);
          }

          // ── Employee Notifications ──
          const notifRes = await fetch(`${API_BASE_URL}/employee/notifications`, { headers });
          if (notifRes.ok) {
            const notifJson = await notifRes.json();
            const raw = notifJson.data?.data ?? notifJson.data ?? [];
            setEmpNotifs(Array.isArray(raw) ? raw.map(n => ({
              id:      n.id,
              title:   n.title ?? n.type ?? 'Notification',
              message: n.message ?? n.data?.message ?? '',
              read:    !!n.read_at,
              time:    n.created_at,
            })) : []);
          } else {
            // employee notif endpoint might not exist — just use empty array
            setEmpNotifs([]);
          }
        }
      } catch (e) {
        console.error('API Data load error', e);
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [token, user]);

  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_employees', JSON.stringify(employees));
  }, [employees, dataLoading]);
  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_attendance', JSON.stringify(attendance));
  }, [attendance, dataLoading]);
  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_adminNotifs', JSON.stringify(adminNotifs));
  }, [adminNotifs, dataLoading]);
  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_empNotifs', JSON.stringify(empNotifs));
  }, [empNotifs, dataLoading]);
  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_reports', JSON.stringify(reports));
  }, [reports, dataLoading]);
  useEffect(() => {
    if(!dataLoading) AsyncStorage.setItem('ph_trash', JSON.stringify(trash));
  }, [trash, dataLoading]);

  /* ─── Mutations (local state for now) ─── */
  const addEmployee = (emp) =>
    setEmployees(prev => [{ ...emp, id: Date.now() }, ...prev]);

  const updateEmployee = (id, fields) =>
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));

  const addAttendance = (record) =>
    setAttendance(prev => [{ id: Date.now(), ...record }, ...prev]);

  const markAdminNotifRead = (id) => {
    setAdminNotifs(prev =>
      id === 'all' ? prev.map(n => ({ ...n, read: true }))
                   : prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markEmpNotifRead = (id) => {
    setEmpNotifs(prev =>
      id === 'all' ? prev.map(n => ({ ...n, read: true }))
                   : prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteReport = id => {
    setReports(current => {
      const report = current.find(r => r.id === id);
      if (report) {
        setTrash(t => [{ ...report, deletedAt: new Date().toISOString(), type: 'report' }, ...t]);
      }
      return current.filter(r => r.id !== id);
    });
  };
  
  const deleteAllReports = () => {
    setReports(current => {
      if (current.length > 0) {
        setTrash(t => [
          ...current.map(r => ({ ...r, deletedAt: new Date().toISOString(), type: 'report' })),
          ...t
        ]);
      }
      return [];
    });
  };

  const deleteNotification = (id, role = 'admin') => {
    if (role === 'admin') setAdminNotifs(prev => prev.filter(n => n.id !== id));
    else                  setEmpNotifs(prev => prev.filter(n => n.id !== id));
  };

  /* ─── Refresh helper (call after mutations) ─── */
  const refresh = () => {
    // Re-trigger the useEffect by bumping a counter would work, but for now
    // callers can just call load() — expose it if needed.
  };

  const clearTrash = () => setTrash([]);
  const restoreFromTrash = id => {
    setTrash(current => {
      const item = current.find(t => t.id === id);
      if (item) {
        if (item.type === 'report') {
          setReports(r => [item, ...r]);
        } else if (item.type === 'employee') {
          setEmployees(e => [item, ...e]);
        }
      }
      return current.filter(t => t.id !== id);
    });
  };
  const deleteFromTrash = id => setTrash(current => current.filter(t => t.id !== id));

  const deleteEmployee = id => {
    setEmployees(current => {
      const employee = current.find(e => e.id === id);
      if (employee) {
        setTrash(t => [{ ...employee, deletedAt: new Date().toISOString(), type: 'employee' }, ...t]);
      }
      return current.filter(e => e.id !== id);
    });
  };

  return (
    <DataContext.Provider value={{
      employees, addEmployee, updateEmployee, deleteEmployee,
      attendance, addAttendance,
      adminNotifs, markAdminNotifRead,
      empNotifs,   markEmpNotifRead,
      reports, deleteReport, deleteAllReports,
      deleteNotification,
      trash, clearTrash, restoreFromTrash, deleteFromTrash,
      loading: dataLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
