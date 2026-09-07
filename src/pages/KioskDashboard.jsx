
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, CheckCircle, XCircle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_BASE_URL, SERVER_BASE_URL } from '../config';

const KioskDashboard = () => {
  const { logout, token } = useAuth();
  const { employees, refresh } = useData();

  const [matricule, setMatricule] = useState('');
  const [step, setStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const [sessionId, setSessionId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef(null);
  const scannerAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------
  // CLOCK
  // ---------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // SCANNER ANIMATION
  // ---------------------------------------------------------

  useEffect(() => {
    if (step === 'scanning') {
      scannerAnim.setValue(0);

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, {
            toValue: 180,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scannerAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
        scannerAnim.stopAnimation();
      };
    }

    scannerAnim.stopAnimation();
  }, [step, scannerAnim]);

  // ---------------------------------------------------------
  // EMPLOYEE LOOKUP
  // ---------------------------------------------------------

  const handleAction = async (type) => {
    Keyboard.dismiss();

    const idToSearch = matricule.trim();

    if (!idToSearch) {
      showFeedback(
        'error',
        'Please enter your Employee ID.',
        null
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/kiosk/employee/lookup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            employee_id: idToSearch,
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        const empData = json.data;

        const photoValue =
          empData.profile_picture ??
          empData.profile_image ??
          null;

        const mappedEmp = {
          id: empData.employee_id,
          matricule: empData.employee_id,
          name: empData.name,
          department: empData.department || 'General',
          position: empData.position || 'Staff',

          avatar: photoValue
            ? photoValue.startsWith('http://') ||
              photoValue.startsWith('https://')
              ? photoValue
              : `${SERVER_BASE_URL}${
                  photoValue.startsWith('/')
                    ? photoValue
                    : `/${photoValue}`
                }`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                empData.name || 'User'
              )}&background=1e293b&color=fff&size=150`,

          status: 'Active',
        };

        setPendingEmployee(mappedEmp);
        setPendingAction(type);
        setShowConfirm(true);

        return;
      }

      if (json?.message) {
        showFeedback(
          'error',
          json.message,
          null,
          null,
          json.code
        );

        return;
      }
    } catch (error) {
      console.warn(
        'API lookup error, checking local store:',
        error
      );
    } finally {
      setLoading(false);
    }

    // -------------------------------------------------------
    // LOCAL FALLBACK
    // -------------------------------------------------------

    const localEmp = employees.find(
      (employee) =>
        (employee.matricule &&
          employee.matricule.toLowerCase() ===
            idToSearch.toLowerCase()) ||
        (employee.name &&
          employee.name.toLowerCase() ===
            idToSearch.toLowerCase())
    );

    if (!localEmp) {
      showFeedback(
        'error',
        `Employee ID "${idToSearch}" not found. Please verify your ID or contact administration.`,
        null
      );

      return;
    }

    if (localEmp.status === 'Inactive') {
      showFeedback(
        'error',
        `Account for ${localEmp.name} is currently Inactive/Suspended. Please contact HR.`,
        localEmp
      );

      return;
    }

    setPendingEmployee(localEmp);
    setPendingAction(type);
    setShowConfirm(true);
  };

  // ---------------------------------------------------------
  // CONFIRM EMPLOYEE + START CAMERA
  // ---------------------------------------------------------

  const confirmIdentity = async () => {
    try {
      let cameraGranted = permission?.granted;

      if (!cameraGranted) {
        const permissionResult = await requestPermission();
        cameraGranted = permissionResult.granted;
      }

      if (!cameraGranted && Platform.OS !== 'web') {
        showFeedback(
          'error',
          'Camera permission is required to scan your face.',
          null
        );

        return;
      }

      const emp = pendingEmployee;
      const action = pendingAction;

      if (!emp) {
        showFeedback(
          'error',
          'Employee information is missing.',
          null
        );

        return;
      }

      setShowConfirm(false);

      setCurrentEmployee(emp);
      setActionType(action);
      setStep('scanning');

      let activeSessionId = null;

      // -----------------------------------------------------
      // CREATE ATTENDANCE SESSION
      // -----------------------------------------------------

      try {
        const sessionRes = await fetch(
          `${API_BASE_URL}/kiosk/attendance/session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              employee_id: emp.matricule || emp.id,
            }),
          }
        );

        if (sessionRes.ok) {
          const sessionJson = await sessionRes.json();

          activeSessionId =
            sessionJson.data?.session_id ?? null;

          setSessionId(activeSessionId);
        } else {
          console.warn(
            'Attendance session creation failed:',
            sessionRes.status
          );
        }
      } catch (error) {
        console.warn(
          'Failed to create kiosk attendance session:',
          error
        );
      }

      // Give the camera time to mount before capture.
      setTimeout(() => {
        verifyAndRecordAttendance(
          emp,
          action,
          activeSessionId
        );
      }, 3500);
    } catch (error) {
      console.error(
        'Camera permission/start error:',
        error
      );

      showFeedback(
        'error',
        'Unable to start the camera. Please check camera permissions.',
        null
      );
    }
  };

  // ---------------------------------------------------------
  // CANCEL CONFIRMATION
  // ---------------------------------------------------------

  const cancelIdentity = () => {
    setShowConfirm(false);
    setPendingEmployee(null);
    setPendingAction(null);
  };

  // ---------------------------------------------------------
  // FACE VERIFICATION
  // ---------------------------------------------------------

  const verifyAndRecordAttendance = async (
    emp,
    action,
    currentSessionId
  ) => {
    let base64Face = null;

    try {
      if (!cameraRef.current) {
        throw new Error(
          'Camera reference is not available.'
        );
      }

      if (
        typeof cameraRef.current.takePictureAsync !==
        'function'
      ) {
        throw new Error(
          'Camera capture is not available.'
        );
      }

      console.log('📸 Capturing camera image...');

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: false,
        });

      if (!photo?.base64) {
        throw new Error(
          'Camera did not return an image.'
        );
      }

      base64Face = photo.base64;

      console.log(
        '✅ Camera image captured successfully'
      );
    } catch (error) {
      console.error(
        '❌ Camera capture failed:',
        error
      );

      showFeedback(
        'error',
        'Unable to capture your face. Please make sure your face is visible and try again.',
        emp
      );

      return;
    }

    // -------------------------------------------------------
    // SEND FACE TO LARAVEL
    // -------------------------------------------------------

    try {
      console.log(
        '📡 Sending face image to Laravel...'
      );

      const verifyRes = await fetch(
        `${API_BASE_URL}/kiosk/attendance/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            employee_id: emp.matricule || emp.id,
            face_data: base64Face,
          }),
        }
      );

      const json = await verifyRes.json();

      console.log(
        '📥 Attendance verification response:',
        json
      );

      if (verifyRes.ok && json.success) {
        const resultData = json.data;

        const isCheckOut =
          resultData.type === 'check_out' ||
          action === 'check-out';

        const now = new Date();

        const formattedStatus = isCheckOut
          ? 'Departed'
          : now.getHours() >= 9 &&
            now.getMinutes() > 0
          ? 'Late'
          : 'Present';

        refresh();

        showFeedback(
          'success',
          isCheckOut
            ? 'Successfully checked out.'
            : 'Successfully checked in.',
          emp,
          formattedStatus
        );
      } else {
        const detailedError =
          json.message ||
          json.error_detail ||
          'Face verification failed: Biometrics mismatch.';

        showFeedback(
          'error',
          detailedError,
          emp,
          null,
          json.code
        );
      }
    } catch (error) {
      console.error(
        '❌ Kiosk verify error:',
        error
      );

      showFeedback(
        'error',
        'Attendance verification error: Unable to connect to the attendance service. Please check the network connection.',
        emp
      );
    }
  };

  // ---------------------------------------------------------
  // FEEDBACK
  // ---------------------------------------------------------

  const showFeedback = (
    type,
    message,
    employee,
    status = null,
    errorCode = null
  ) => {
    setFeedback({
      type,
      message,
      employee,
      status,
      errorCode,
    });

    setStep('feedback');

    setMatricule('');
    setCurrentEmployee(null);
    setActionType(null);
    setSessionId(null);

    const timeoutDuration =
      type === 'error' ? 6000 : 4000;

    setTimeout(() => {
      setFeedback(null);
      setStep('input');
    }, timeoutDuration);
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* ---------------------------------------------------
          CONFIRMATION MODAL
      ---------------------------------------------------- */}

      <Modal
        visible={showConfirm}
        transparent
        animationType="none"
        onRequestClose={cancelIdentity}
      >
        <Pressable
          style={styles.modalBackdropCentered}
          onPress={cancelIdentity}
        >
          <Pressable style={styles.confirmDialogCard}>
            <Text style={styles.confirmDialogTitle}>
              Confirm Identity
            </Text>

            {pendingEmployee && (
              <>
                <Image
                  source={{
                    uri:
                      pendingEmployee.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        pendingEmployee.name || 'User'
                      )}&background=1e293b&color=fff&size=150`,
                  }}
                  style={styles.confirmAvatar}
                />

                <Text
                  style={styles.confirmDialogMessage}
                >
                  Are you{' '}
                  <Text
                    style={{
                      fontWeight: '700',
                      color: colors.slate[900],
                    }}
                  >
                    {pendingEmployee.name}
                  </Text>
                  ?
                </Text>
              </>
            )}

            <View style={styles.confirmDialogActions}>
              <TouchableOpacity
                style={styles.confirmDialogButtonCancel}
                onPress={cancelIdentity}
              >
                <Text
                  style={
                    styles.confirmDialogButtonCancelText
                  }
                >
                  No, cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDialogButtonConfirm}
                onPress={confirmIdentity}
              >
                <Text
                  style={
                    styles.confirmDialogButtonConfirmText
                  }
                >
                  Yes, that's me
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------------------------------------------------
          HEADER
      ---------------------------------------------------- */}

      <View style={styles.header}>
        <Image
          source={require('../../assets/new logo transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <LogOut
            size={20}
            color={colors.slate[600]}
          />

          <Text style={styles.logoutText}>
            Exit Kiosk
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ------------------------------------------------
              CLOCK
          ------------------------------------------------- */}

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>

            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* ------------------------------------------------
              SCANNING
          ------------------------------------------------- */}

          {step === 'scanning' &&
          currentEmployee ? (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>
                Facial Recognition
              </Text>

              <Text style={styles.actionSubtitle}>
                Please look directly into the camera
              </Text>

              <View style={styles.scannerContainer}>
                {permission?.granted ? (
                  <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                    active={true}
                    onCameraReady={() => {
                      console.log(
                        '✅ Camera is ready'
                      );
                    }}
                    onMountError={(error) => {
                      console.error(
                        '❌ Camera mount error:',
                        error
                      );
                    }}
                  />
                ) : (
                  <View
                    style={styles.cameraPermissionContainer}
                  >
                    <Text
                      style={
                        styles.cameraPermissionText
                      }
                    >
                      Camera permission required
                    </Text>
                  </View>
                )}

                {/* Camera overlay */}
                <View
                  pointerEvents="none"
                  style={styles.scannerOverlay}
                />

                {/* Scanning line */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scannerLine,
                    {
                      transform: [
                        {
                          translateY: scannerAnim,
                        },
                      ],
                    },
                  ]}
                />
              </View>

              <Text style={styles.scannerText}>
                Authenticating{' '}
                {currentEmployee.name}...
              </Text>

              <Text style={styles.cameraStatusText}>
                Keep your face inside the circle
              </Text>
            </View>
          ) : step === 'feedback' &&
            feedback ? (
            /* ------------------------------------------------
               FEEDBACK
            ------------------------------------------------- */

            <View
              style={[
                styles.feedbackCard,
                feedback.type === 'error' &&
                  styles.feedbackCardError,
              ]}
            >
              {feedback.type === 'success' ? (
                <CheckCircle
                  size={64}
                  color={
                    colors.success || '#10b981'
                  }
                  style={styles.feedbackIcon}
                />
              ) : (
                <XCircle
                  size={64}
                  color={
                    colors.danger || '#ef4444'
                  }
                  style={styles.feedbackIcon}
                />
              )}

              <Text
                style={[
                  styles.feedbackTitle,
                  feedback.type === 'error' && {
                    color:
                      colors.danger || '#ef4444',
                  },
                ]}
              >
                {feedback.type === 'success'
                  ? 'Verification Successful'
                  : 'Verification Issue Detected'}
              </Text>

              <View
                style={[
                  styles.feedbackMessageBox,
                  feedback.type === 'error' &&
                    styles.feedbackErrorBox,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackMessage,
                    feedback.type === 'error' &&
                      styles.feedbackErrorMessage,
                  ]}
                >
                  {feedback.message}
                </Text>
              </View>

              {feedback.employee && (
                <View style={styles.employeeInfo}>
                  <Image
                    source={{
                      uri:
                        feedback.employee.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          feedback.employee.name ||
                            'User'
                        )}&background=1e293b&color=fff&size=150`,
                    }}
                    style={styles.employeeAvatar}
                  />

                  <Text
                    style={styles.employeeName}
                  >
                    {feedback.employee.name}
                  </Text>

                  <Text
                    style={styles.employeeDept}
                  >
                    {feedback.employee.department} •{' '}
                    {feedback.employee.position}
                  </Text>

                  {feedback.status && (
                    <View
                      style={[
                        styles.statusBadge,
                        feedback.status === 'Late'
                          ? styles.statusLate
                          : styles.statusPresent,
                      ]}
                    >
                      <Text
                        style={styles.statusText}
                      >
                        {feedback.status}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.dismissButton,
                  feedback.type === 'error'
                    ? styles.dismissButtonError
                    : styles.dismissButtonSuccess,
                ]}
                onPress={() => {
                  setFeedback(null);
                  setStep('input');
                }}
              >
                <Text
                  style={[
                    styles.dismissButtonText,
                    feedback.type === 'error' && {
                      color: '#ef4444',
                    },
                  ]}
                >
                  {feedback.type === 'error'
                    ? 'Retry / Scan Again'
                    : 'Done'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ------------------------------------------------
               INPUT
            ------------------------------------------------- */

            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>
                Welcome to Presenza
              </Text>

              <Text style={styles.actionSubtitle}>
                Enter your Employee ID to check in or
                out
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. EMP001"
                placeholderTextColor={
                  colors.slate[400]
                }
                value={matricule}
                onChangeText={setMatricule}
                autoCapitalize="characters"
                autoCorrect={false}
                onSubmitEditing={() =>
                  handleAction('check-in')
                }
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonCheckIn,
                  ]}
                  onPress={() =>
                    handleAction('check-in')
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      color={colors.white}
                    />
                  ) : (
                    <Text
                      style={styles.buttonText}
                    >
                      Check In
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonCheckOut,
                  ]}
                  onPress={() =>
                    handleAction('check-out')
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      color={colors.slate[700]}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        styles.buttonTextDark,
                      ]}
                    >
                      Check Out
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },

  keyboardContainer: {
    flex: 1,
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
    zIndex: 10,
    elevation: 10,
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
    paddingBottom: 100,
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
    textAlign: 'center',
  },

  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 500,
    shadowColor: colors.slate[900],
    shadowOffset: {
      width: 0,
      height: 10,
    },
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

  // =======================================================
  // CAMERA
  // =======================================================

  scannerContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: '#111827',
    borderWidth: 4,
    borderColor: colors.slate[100],
  },

  camera: {
    width: '100%',
    height: '100%',
  },

  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.slate[900],
  },

  cameraPermissionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 23, 77, 0.08)',
  },

  scannerLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    top: 10,
    height: 4,
    backgroundColor: colors.pink[800],
    shadowColor: colors.pink[800],
    shadowOffset: {
      width: 0,
      height: 0,
    },
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

  cameraStatusText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.slate[500],
    textAlign: 'center',
  },

  // =======================================================
  // FEEDBACK
  // =======================================================

  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 500,
    shadowColor: colors.slate[900],
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate[100],
  },

  feedbackCardError: {
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },

  feedbackIcon: {
    marginBottom: spacing.md,
  },

  feedbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  feedbackMessageBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.slate[50],
    marginBottom: spacing.lg,
  },

  feedbackErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#f87171',
  },

  feedbackMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[700],
    textAlign: 'center',
    lineHeight: 22,
  },

  feedbackErrorMessage: {
    color: '#991b1b',
    fontWeight: '600',
  },

  employeeInfo: {
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.lg,
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
    textAlign: 'center',
  },

  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 100,
  },

  statusPresent: {
    backgroundColor:
      'rgba(16, 185, 129, 0.2)',
  },

  statusLate: {
    backgroundColor:
      'rgba(245, 158, 11, 0.2)',
  },

  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[800],
  },

  dismissButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  dismissButtonError: {
    backgroundColor: '#fee2e2',
  },

  dismissButtonSuccess: {
    backgroundColor: colors.slate[100],
  },

  dismissButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[700],
  },

  // =======================================================
  // CONFIRMATION MODAL
  // =======================================================

  modalBackdropCentered: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.6)',
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
