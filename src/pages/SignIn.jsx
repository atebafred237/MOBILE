import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreementError, setAgreementError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();
  const { login } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true);
    });
    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!agreed) {
      setAgreementError('Please agree to the Terms & Policies before signing in.');
      return;
    }

    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPasswordEmail');
  };

  const passwordChecks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strengthScore = passwordChecks.filter(Boolean).length;
  const strengthLabel = strengthScore < 3 ? 'Weak' : strengthScore < 5 ? 'Medium' : 'Strong';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Pressable style={styles.inner} onPress={Keyboard.dismiss}>
        <Image
          source={require('../../assets/new logo transparent.png')}
          style={[styles.logo, keyboardVisible && styles.logoCompact]}
          resizeMode="contain"
        />

        <View style={[styles.card, keyboardVisible && styles.cardCompact]}>
          <Text style={styles.title}>{t('welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('credentialsSubtitle')}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('emailAddress')}</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
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
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAgreed(value => !value);
                setAgreementError('');
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.checkboxText}>{t('agreeTerms')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
          {!!agreementError && <Text style={styles.agreementError}>{agreementError}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('signIn')}</Text>
            )}
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
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
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
  cardCompact: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.slate[900],
    textAlign: 'center',
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
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
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
  input: {
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.slate[50],
    color: colors.slate[900],
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 54,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.slate[50],
    color: colors.slate[900],
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  eyeText: {
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.slate[400],
    backgroundColor: colors.white,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.pink[800],
    borderColor: colors.pink[800],
  },
  checkboxText: {
    fontSize: 12,
    color: colors.slate[600],
    flexShrink: 1,
  },
  agreementError: {
    color: colors.danger,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  forgotText: {
    fontSize: 12,
    color: colors.pink[800],
    fontWeight: '600',
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
});

export default SignIn;
