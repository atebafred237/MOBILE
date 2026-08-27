import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useLanguage } from '../context/LanguageContext';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 60;
const VALID_OTP = '12345';
const MAX_ATTEMPTS = 3;

const ForgotPassword = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const [popupMessage, setPopupMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const updateOtpValue = (value, index) => {
    const nextOtp = [...otp];
    nextOtp[index] = value.replace(/\D/g, '').slice(-1);
    setOtp(nextOtp);
    setSuccessMessage('');

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (nextOtp.every(Boolean)) {
      handleVerify(nextOtp.join(''));
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const nextOtp = [...otp];
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (enteredCode = otp.join('')) => {
    const code = enteredCode;

    if (code.length !== OTP_LENGTH) {
      setPopupMessage('Please enter the full 5-digit verification code.');
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setPopupMessage('You have used all 3 attempts. Please resend the code to try again.');
      return;
    }

    if (code !== VALID_OTP) {
      const nextAttempts = Math.min(attempts + 1, MAX_ATTEMPTS);
      setAttempts(nextAttempts);
      setPopupMessage(
        `That verification code is incorrect. Attempt ${nextAttempts} of ${MAX_ATTEMPTS}.`,
      );
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    setLoading(false);
    navigation.navigate('ResetPassword');
  };

  const handleResend = async (force = false) => {
    if (timeLeft > 0 && !force) return;

    setPopupMessage('');
    setSuccessMessage('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    setLoading(false);
    setTimeLeft(RESEND_SECONDS);
    setAttempts(0);
    setSuccessMessage('A new verification code has been sent to your email.');
    inputsRef.current[0]?.focus();
  };

  const handleTryAgain = () => {
    setPopupMessage('');
    setSuccessMessage('');
    setOtp(Array(OTP_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
  };

  const handlePopupAction = () => {
    if (attempts >= MAX_ATTEMPTS) {
      handleResend(true);
      return;
    }

    handleTryAgain();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
        <Image
          source={require('../../assets/new logo transparent.png')}
          style={[styles.logo, styles.logoCompact]}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.timerText}>
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'You can resend now'}
          </Text>
          {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

          <Text style={styles.title}>{t('verifyIdentity')}</Text>
          <Text style={styles.subtitle}>
            {t('verifySubtitle')}
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputsRef.current[index] = ref)}
                style={styles.otpBox}
                value={digit}
                onChangeText={value => updateOtpValue(value, index)}
                onKeyPress={event => handleOtpKeyPress(event, index)}
                maxLength={1}
                keyboardType="number-pad"
                textAlign="center"
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerify}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : t('verifyCode')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, timeLeft > 0 && styles.secondaryButtonDisabled]}
            onPress={handleResend}
            disabled={loading || timeLeft > 0}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryButtonText, timeLeft > 0 && styles.secondaryButtonTextDisabled]}>
              {loading ? 'Sending...' : timeLeft > 0 ? 'Resend code' : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.backLinkWrap}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.backLinkText}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          transparent
          visible={!!popupMessage}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPopupMessage('')}
        >
          <View style={styles.popupBackdrop}>
            <View style={styles.popupCard}>
              <View style={styles.popupIcon}>
                <Text style={styles.popupIconText}>!</Text>
              </View>
              <Text style={styles.popupTitle}>Verification code</Text>
              <Text style={styles.popupMessage}>{popupMessage}</Text>
              <TouchableOpacity
                style={styles.popupButton}
                onPress={handlePopupAction}
                accessibilityRole="button"
              >
                <Text style={styles.popupButtonText}>
                  {attempts >= MAX_ATTEMPTS ? 'Resend code' : 'Try again'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  logo: {
    alignSelf: 'center',
    aspectRatio: 1254 / 303,
    marginBottom: -50,
    maxWidth: 260,
    width: '100%',
  },
  logoCompact: {
    marginBottom: -90,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginBottom: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.slate[900],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate[300],
    backgroundColor: colors.slate[50],
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate[900],
  },
  button: {
    backgroundColor: colors.pink[800],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.pink[800],
  },
  secondaryButtonDisabled: {
    borderColor: colors.slate[300],
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: colors.pink[800],
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonTextDisabled: {
    color: colors.slate[400],
  },
  timerText: {
    textAlign: 'center',
    color: colors.slate[700],
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  successText: {
    color: colors.green[600],
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  backLinkWrap: {
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: colors.pink[800],
    fontSize: 12,
    fontWeight: '600',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 6,
    borderTopColor: colors.pink[800],
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  popupIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.pink[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  popupIconText: {
    color: colors.pink[800],
    fontSize: 26,
    fontWeight: '700',
  },
  popupTitle: {
    color: colors.slate[900],
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  popupMessage: {
    color: colors.slate[500],
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  popupButton: {
    width: '100%',
    backgroundColor: colors.pink[800],
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  popupButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ForgotPassword;
