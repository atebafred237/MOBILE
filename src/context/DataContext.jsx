import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL, SERVER_BASE_URL } from '../config';

const DataContext = createContext();
// Helper to normalize avatar URLs consistently
const normalizeAvatarUrl = (img, fallback = null) => {
  if (!img) return fallback;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('blob:') || img.startsWith('data:')) return img;
  const normalizedPath = img.startsWith('/') ? img : `/${img}`;
  return `${SERVER_BASE_URL}${normalizedPath}`;
};

export const DataProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [employees,  setEmployees]  = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [empNotifs,   setEmpNotifs]   = useState([]);
  const [reports,     setReports]     = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  /* ─── Fetch from API whenever the user / token changes ─── */
  useEffect(() => {
    if (!token || !user) return;   // not logged in yet

    const load = async () => {
      setDataLoading(true);
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
              avatar:     (() => {
                const img = e.reference_photo_path ?? e.profile_image ?? e.user?.profile_image ?? e.user?.avatar;
                if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name || e.user?.email || 'User')}&background=1e293b&color=fff&size=150`;
                  if (img.startsWith('http://') || img.startsWith('https://')) return img;
                  const normalizedPath = img.startsWith('/') ? img : `/${img}`;
                  return `${SERVER_BASE_URL}${normalizedPath}`;
              })(),
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
              avatar:     (() => {
                const img = a.employee?.reference_photo_path ?? a.employee?.profile_image ?? a.employee?.user?.profile_image ?? a.employee?.user?.avatar;
                if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(a.employee?.full_name || 'User')}&background=1e293b&color=fff&size=150`;
                 return normalizeAvatarUrl(img);
              })(),
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

  const refresh = async () => {
    if (!token || !user) return;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    try {
      if (user.role === 'admin' || user.role === 'supervisor') {
        const [empRes, attRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/employees`, { headers }),
          fetch(`${API_BASE_URL}/admin/attendance`, { headers })
        ]);

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
            avatar:     (() => {
              const img = e.reference_photo_path ?? e.profile_image ?? e.user?.profile_image ?? e.user?.avatar;
              if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name || e.user?.email || 'User')}&background=1e293b&color=fff&size=150`;
                return normalizeAvatarUrl(img);
            })(),
            status:     e.status === 'active' ? 'Active' : 'Inactive',
          })));
        }

        if (attRes.ok) {
          const attJson = await attRes.json();
          const raw = attJson.data?.data ?? attJson.data ?? [];
          setAttendance(raw.map(a => ({
            id:         a.id,
            employeeId: a.employee?.employee_code ?? a.employee_id,
            name:       a.employee?.full_name ?? `Employee #${a.employee_id}`,
            department: a.employee?.department ?? 'General',
            avatar:     (() => {
              const img = a.employee?.reference_photo_path ?? a.employee?.profile_image ?? a.employee?.user?.profile_image ?? a.employee?.user?.avatar;
              if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(a.employee?.full_name || 'User')}&background=1e293b&color=fff&size=150`;
                return normalizeAvatarUrl(img);
            })(),
            date:       a.attendance_date,
            timestamp:  a.check_in_at ? new Date(a.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            checkOut:   a.check_out_at ? new Date(a.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            status:     a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : 'Present',
            method:     a.check_in_method ?? 'Kiosk',
            location:   'Main Entrance',
          })));
        }
      }
    } catch (e) {
      console.error('API Data refresh error', e);
    }
  };

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

  const deleteReport       = (id) => setReports(prev => prev.filter(r => r.id !== id));
  const deleteAllReports   = ()   => setReports([]);
  const deleteNotification = (id, role = 'admin') => {
    if (role === 'admin') setAdminNotifs(prev => prev.filter(n => n.id !== id));
    else                  setEmpNotifs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DataContext.Provider value={{
      employees,  addEmployee,  updateEmployee,
      attendance, addAttendance,
      adminNotifs, markAdminNotifRead,
      empNotifs,   markEmpNotifRead,
      reports, deleteReport, deleteAllReports,
      deleteNotification,
      refresh,
      loading: dataLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
