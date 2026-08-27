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

const ForgotPasswordEmail = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    navigation.navigate('ForgotPassword', { email: normalizedEmail });
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
          <Text style={styles.title}>{t('forgotTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('forgotSubtitle')}
          </Text>

          <Text style={styles.label}>{t('emailAddress')}</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="you@example.com"
            value={email}
            onChangeText={value => {
              setEmail(value);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="continue"
            onSubmitEditing={handleContinue}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('verify')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.backLinkText}>Back to sign in</Text>
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
    fontWeight: '700',
    color: colors.slate[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  inputError: {
    borderColor: colors.danger,
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
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
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

export default ForgotPasswordEmail;
