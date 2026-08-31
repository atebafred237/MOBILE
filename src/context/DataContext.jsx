import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employees as initialEmployees, allAttendance, adminNotifications as initAdminNotifs, employeeNotifications as initEmpNotifs, downloadedReports as initReports } from '../data/mockData';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [attendance, setAttendance] = useState(allAttendance);
  const [adminNotifs, setAdminNotifs] = useState(initAdminNotifs);
  const [empNotifs, setEmpNotifs] = useState(initEmpNotifs);
  const [reports, setReports] = useState(initReports);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedEmp = await AsyncStorage.getItem('ph_employees');
        if (savedEmp) setEmployees(JSON.parse(savedEmp));
        
        const savedAtt = await AsyncStorage.getItem('ph_attendance');
        if (savedAtt) setAttendance(JSON.parse(savedAtt));
        
        const savedAdNot = await AsyncStorage.getItem('ph_adminNotifs');
        if (savedAdNot) {
          const savedNotifications = JSON.parse(savedAdNot);
          setAdminNotifs([...savedNotifications, ...initAdminNotifs.filter(notification => !savedNotifications.some(saved => saved.id === notification.id))]);
        }
        
        const savedEmpNot = await AsyncStorage.getItem('ph_empNotifs');
        if (savedEmpNot) {
          const savedNotifications = JSON.parse(savedEmpNot);
          setEmpNotifs([...savedNotifications, ...initEmpNotifs.filter(notification => !savedNotifications.some(saved => saved.id === notification.id))]);
        }

        const savedReports = await AsyncStorage.getItem('ph_reports');
        if (savedReports) setReports(JSON.parse(savedReports));

        const savedTrash = await AsyncStorage.getItem('ph_trash');
        if (savedTrash) setTrash(JSON.parse(savedTrash));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_employees', JSON.stringify(employees));
  }, [employees, loading]);
  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_attendance', JSON.stringify(attendance));
  }, [attendance, loading]);
  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_adminNotifs', JSON.stringify(adminNotifs));
  }, [adminNotifs, loading]);
  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_empNotifs', JSON.stringify(empNotifs));
  }, [empNotifs, loading]);
  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_reports', JSON.stringify(reports));
  }, [reports, loading]);
  useEffect(() => {
    if(!loading) AsyncStorage.setItem('ph_trash', JSON.stringify(trash));
  }, [trash, loading]);

  const addEmployee = (emp) => {
    setEmployees([{ ...emp, id: employees.length + 1, avatar: emp.avatar || 'https://i.pravatar.cc/150' }, ...employees]);
  };

  const updateEmployee = (id, updatedFields) => {
    setEmployees(current => current.map(emp => emp.id === id ? { ...emp, ...updatedFields } : emp));
  };

  const addAttendance = (record) => {
    setAttendance([{ id: Date.now(), ...record }, ...attendance]);
  };

  const markAdminNotifRead = (id) => {
    if(id === 'all') {
      setAdminNotifs(adminNotifs.map(n => ({...n, read: true})));
    } else {
      setAdminNotifs(adminNotifs.map(n => n.id === id ? {...n, read: true} : n));
    }
  };

  const markEmpNotifRead = (id) => {
    if(id === 'all') {
      setEmpNotifs(empNotifs.map(n => ({...n, read: true})));
    } else {
      setEmpNotifs(empNotifs.map(n => n.id === id ? {...n, read: true} : n));
    }
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
    if (role === 'admin') {
      setAdminNotifs(current => current.filter(notification => notification.id !== id));
      return;
    }
    setEmpNotifs(current => current.filter(notification => notification.id !== id));
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
      empNotifs, markEmpNotifRead,
      reports, deleteReport, deleteAllReports,
      deleteNotification,
      trash, clearTrash, restoreFromTrash, deleteFromTrash,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
