import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Animated, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme';
import { LogOut, CheckCircle, XCircle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const KioskDashboard = () => {
  const { logout } = useAuth();
  const { employees, attendance, addAttendance } = useData();
  const [matricule, setMatricule] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'scanning' | 'feedback'
  const [feedback, setFeedback] = useState(null); 
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permission, requestPermission] = useCameraPermissions();
  
  const scannerAnim = useRef(new Animated.Value(0)).current;

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scanner animation
  useEffect(() => {
    if (step === 'scanning') {
      scannerAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, { toValue: 200, duration: 1200, useNativeDriver: true }),
          Animated.timing(scannerAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
        ])
      ).start();
    } else {
      scannerAnim.stopAnimation();
    }
  }, [step, scannerAnim]);

  const handleAction = (type) => {
    Keyboard.dismiss();
    
    if (!matricule.trim()) {
      showFeedback('error', 'Please enter your Employee ID.', null);
      return;
    }

    const emp = employees.find(e => e.matricule.toLowerCase() === matricule.trim().toLowerCase());
    
    if (!emp) {
      showFeedback('error', 'Employee not found. Please check your ID.', null);
      return;
    }

    if (emp.status === 'Inactive') {
      showFeedback('error', 'Account is inactive. Please contact HR.', emp);
      return;
    }

    setPendingEmployee(emp);
    setPendingAction(type);
    setShowConfirm(true);
  };

  const confirmIdentity = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showFeedback('error', 'Camera permission is required to scan your face.', null);
        return;
      }
    }

    setShowConfirm(false);
    setCurrentEmployee(pendingEmployee);
    setActionType(pendingAction);
    setStep('scanning');

    // Simulate facial scan
    setTimeout(() => {
      finalizeAction(pendingEmployee, pendingAction);
    }, 3500);
  };

  const cancelIdentity = () => {
    setShowConfirm(false);
    setPendingEmployee(null);
    setPendingAction(null);
  };

  const finalizeAction = (emp, type) => {
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    let status = 'Present';
    if (type === 'check-in') {
      if (currentHour > 9 || (currentHour === 9 && currentMinutes > 0)) {
        status = 'Late';
      }
    }

    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'check-in') {
      addAttendance({
        employeeId: emp.id,
        name: emp.name,
        department: emp.department,
        avatar: emp.avatar,
        date: currentTime.toISOString().split('T')[0],
        timestamp: timeString,
        checkOut: null,
        status: status,
        authMethod: 'Facial Recognition',
        location: 'Main Entrance'
      });
      showFeedback('success', 'Successfully checked in.', emp, status);
    } else {
      showFeedback('success', 'Successfully checked out.', emp, 'Departed');
    }
  };

  const showFeedback = (type, message, employee, status = null) => {
    setFeedback({ type, message, employee, status });
    setStep('feedback');
    setMatricule('');
    setCurrentEmployee(null);
    setActionType(null);
    
    setTimeout(() => {
      setFeedback(null);
      setStep('input');
    }, 4000); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showConfirm} transparent={true} animationType="none" onRequestClose={cancelIdentity}>
        <Pressable style={styles.modalBackdropCentered} onPress={cancelIdentity}>
          <Pressable style={styles.confirmDialogCard}>
            <Text style={styles.confirmDialogTitle}>Confirm Identity</Text>
            {pendingEmployee && (
              <>
                <Image source={{ uri: pendingEmployee.avatar || 'https://i.pravatar.cc/150' }} style={styles.confirmAvatar} />
                <Text style={styles.confirmDialogMessage}>
                  Are you <Text style={{ fontWeight: '700', color: colors.slate[900] }}>{pendingEmployee.name}</Text>?
                </Text>
              </>
            )}
            <View style={styles.confirmDialogActions}>
              <TouchableOpacity style={styles.confirmDialogButtonCancel} onPress={cancelIdentity}>
                <Text style={styles.confirmDialogButtonCancelText}>No, cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDialogButtonConfirm} onPress={confirmIdentity}>
                <Text style={styles.confirmDialogButtonConfirmText}>Yes, that's me</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.header, { zIndex: 10, elevation: 10 }]}>
        <Image source={require('../../assets/new logo transparent.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={colors.slate[600]} />
          <Text style={styles.logoutText}>Exit Kiosk</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1, zIndex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.content} 
          bounces={false} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {step === 'scanning' && currentEmployee ? (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Facial Recognition</Text>
              <Text style={styles.actionSubtitle}>Please look at the camera</Text>
              
              <View style={styles.scannerContainer}>
                {permission?.granted ? (
                  <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
                ) : (
                  <Image source={{ uri: currentEmployee.avatar || 'https://i.pravatar.cc/150' }} style={styles.scannerAvatar} />
                )}
                <View style={styles.scannerOverlay} />
                <Animated.View style={[styles.scannerLine, { transform: [{ translateY: scannerAnim }] }]} />
              </View>

              <Text style={styles.scannerText}>Authenticating {currentEmployee.name}...</Text>
            </View>
          ) : step === 'feedback' && feedback ? (
            <View style={styles.feedbackCard}>
              {feedback.type === 'success' ? (
                <CheckCircle size={64} color={colors.success || '#10b981'} style={styles.feedbackIcon} />
              ) : (
                <XCircle size={64} color={colors.danger || '#ef4444'} style={styles.feedbackIcon} />
              )}
              
              <Text style={styles.feedbackMessage}>{feedback.message}</Text>
              
              {feedback.employee && (
                <View style={styles.employeeInfo}>
                  <Image source={{ uri: feedback.employee.avatar || 'https://i.pravatar.cc/150' }} style={styles.employeeAvatar} />
                  <Text style={styles.employeeName}>{feedback.employee.name}</Text>
                  <Text style={styles.employeeDept}>{feedback.employee.department} • {feedback.employee.position}</Text>
                  {feedback.status && (
                    <View style={[styles.statusBadge, feedback.status === 'Late' ? styles.statusLate : styles.statusPresent]}>
                      <Text style={styles.statusText}>{feedback.status}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Welcome to Presenza</Text>
              <Text style={styles.actionSubtitle}>Enter your Employee ID to check in or out</Text>
              
              <TextInput
                style={styles.input}
                placeholder="e.g. EMP-0042"
                placeholderTextColor={colors.slate[400]}
                value={matricule}
                onChangeText={setMatricule}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.buttonCheckIn]} onPress={() => handleAction('check-in')}>
                  <Text style={styles.buttonText}>Check In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.button, styles.buttonCheckOut]} onPress={() => handleAction('check-out')}>
                  <Text style={[styles.buttonText, styles.buttonTextDark]}>Check Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  logo: {
    width: 200,
    height: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.slate[100],
    borderRadius: 8,
  },
  logoutText: {
    color: colors.slate[700],
    fontWeight: '600',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: 100, // Extra padding to allow scrolling up when keyboard is open
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.slate[900],
    letterSpacing: -2,
  },
  dateText: {
    fontSize: 24,
    color: colors.slate[500],
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 500,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: 16,
    color: colors.slate[500],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 70,
    backgroundColor: colors.slate[50],
    borderWidth: 2,
    borderColor: colors.slate[200],
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    fontSize: 24,
    fontWeight: '600',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCheckIn: {
    backgroundColor: colors.pink[900],
  },
  buttonCheckOut: {
    backgroundColor: colors.slate[200],
  },
  buttonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  buttonTextDark: {
    color: colors.slate[800],
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 500,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  feedbackIcon: {
    marginBottom: spacing.lg,
  },
  feedbackMessage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  employeeInfo: {
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  employeeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: spacing.xs,
  },
  employeeDept: {
    fontSize: 16,
    color: colors.slate[500],
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 100,
  },
  statusPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // success transparent
  },
  statusLate: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // warning transparent
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[800],
  },
  scannerContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: colors.slate[100],
  },
  scannerAvatar: {
    width: '100%',
    height: '100%',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 23, 77, 0.1)',
  },
  scannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.pink[800],
    shadowColor: colors.pink[800],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.pink[800],
    textAlign: 'center',
  },
  modalBackdropCentered: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmDialogCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmDialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: spacing.lg,
  },
  confirmAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  confirmDialogMessage: {
    fontSize: 18,
    color: colors.slate[600],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  confirmDialogActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  confirmDialogButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.slate[100],
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDialogButtonCancelText: {
    color: colors.slate[700],
    fontSize: 16,
    fontWeight: '700',
  },
  confirmDialogButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.pink[900],
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDialogButtonConfirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default KioskDashboard;
