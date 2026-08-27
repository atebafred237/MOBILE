import React, { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
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

const ResetPassword = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const passwordChecks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strengthScore = passwordChecks.filter(Boolean).length;
  const strengthLabel = strengthScore < 3 ? 'Weak' : strengthScore < 5 ? 'Medium' : 'Strong';

  const handleCreatePassword = () => {
    const structureError = 'Use 8+ characters with uppercase, lowercase, number, and special character.';
    setPasswordError('');
    setConfirmPasswordError('');

    if (strengthScore < 5) {
      setPasswordError(structureError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    navigation.replace('PasswordSuccess');
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
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.title}>{t('createPassword')}</Text>
          <Text style={styles.subtitle}>
            {t('newPasswordSubtitle')}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('newPassword')}</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter your new password"
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowPassword(value => !value)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide new password' : 'Show new password'}
              >
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, styles[`strengthFill${strengthLabel}`], { width: `${strengthScore * 20}%` }]} />
                </View>
                <Text style={[styles.strengthText, styles[`strengthText${strengthLabel}`]]}>
                  Password strength: {strengthLabel}
                </Text>
              </View>
            )}
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('confirmNewPassword')}</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  setConfirmPasswordError('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowConfirmPassword(value => !value)}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                <Text style={styles.showText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreatePassword}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('createPasswordButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.backLinkText}>Back to verification</Text>
          </TouchableOpacity>
        </View>
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
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[700],
    marginBottom: spacing.xs,
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 64,
    fontSize: 16,
    backgroundColor: colors.slate[50],
    color: colors.slate[900],
  },
  showButton: {
    position: 'absolute',
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  showText: {
    color: colors.pink[800],
    fontWeight: '600',
    fontSize: 12,
  },
  strengthWrap: {
    marginTop: spacing.xs,
  },
  strengthTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.slate[200],
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthFillWeak: {
    backgroundColor: colors.danger,
  },
  strengthFillMedium: {
    backgroundColor: colors.orange[500],
  },
  strengthFillStrong: {
    backgroundColor: colors.green[600],
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
  },
  strengthTextWeak: {
    color: colors.danger,
  },
  strengthTextMedium: {
    color: colors.orange[600],
  },
  strengthTextStrong: {
    color: colors.green[600],
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.pink[800],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backLinkText: {
    color: colors.pink[800],
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ResetPassword;
