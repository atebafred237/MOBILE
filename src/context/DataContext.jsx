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

  const addEmployee = (emp) => {
    setEmployees([{ ...emp, id: employees.length + 1, avatar: emp.avatar || 'https://i.pravatar.cc/150' }, ...employees]);
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

  const deleteReport = id => setReports(current => current.filter(report => report.id !== id));
  const deleteAllReports = () => setReports([]);
  const deleteNotification = (id, role = 'admin') => {
    if (role === 'admin') {
      setAdminNotifs(current => current.filter(notification => notification.id !== id));
      return;
    }
    setEmpNotifs(current => current.filter(notification => notification.id !== id));
  };

  return (
    <DataContext.Provider value={{
      employees, addEmployee,
      attendance, 
      adminNotifs, markAdminNotifRead,
      empNotifs, markEmpNotifRead,
      reports, deleteReport, deleteAllReports,
      deleteNotification,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
