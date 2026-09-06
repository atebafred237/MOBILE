import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';
import { createOrganization, getOrganizationDraft, saveOrganizationDraft } from '../services/organizationService';

const validateEmail = value => /^\S+@\S+\.\S+$/.test(value.trim());
const isStrongPassword = value => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(value);

const CreateAdminAccountScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getOrganizationDraft();
      if (draft) {
        setForm(current => ({
          ...current,
          adminFirstName: draft.adminFirstName || '',
          adminLastName: draft.adminLastName || '',
          adminEmail: draft.adminEmail || '',
        }));
      }
    };

    loadDraft();
  }, []);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.adminFirstName.trim()) nextErrors.adminFirstName = 'First name is required.';
    if (!form.adminLastName.trim()) nextErrors.adminLastName = 'Last name is required.';
    if (!form.adminEmail.trim() || !validateEmail(form.adminEmail)) nextErrors.adminEmail = 'Valid email is required.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (!isStrongPassword(form.password)) nextErrors.password = 'Password must be at least 8 characters, with a capital letter, lowercase letter and number.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const draft = (await getOrganizationDraft()) || {};
      const nextDraft = {
        ...draft,
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.password,
      };
      await saveOrganizationDraft(nextDraft);

      const result = await createOrganization({
        organizationName: draft.organisationName || draft.organizationName || '',
        organizationType: draft.organisationType || draft.organizationType || 'company',
        organizationEmail: draft.organisationEmail || draft.organizationEmail || '',
        phone: draft.phone || '',
        location: draft.location || '',
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.password,
        adminPasswordConfirmation: form.confirmPassword,
        logoUri: draft.logoUri || '',
        workingDays: draft.workingDays || [1, 2, 3, 4, 5],
        startTime: draft.startTime || '08:00',
        endTime: draft.endTime || '17:00',
        timezone: draft.timezone || 'UTC',
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Organization registration failed.');
      }

      navigation.navigate('OrganisationCreatedScreen', {
        organizationName: draft.organisationName || draft.organizationName || 'Your organisation',
        adminEmail: form.adminEmail.trim(),
        firstName: form.adminFirstName.trim(),
        lastName: form.adminLastName.trim(),
        password: form.password,
      });
    } catch (error) {
      Alert.alert('Organization setup failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppSafeArea style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>ADMIN ACCOUNT</Text>
          <Text style={styles.title}>Create your administrator account</Text>
          <Text style={styles.subtitle}>You’ll use this account to manage your organisation.</Text>

          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={[styles.input, errors.adminFirstName && styles.inputError]}
                value={form.adminFirstName}
                onChangeText={value => updateField('adminFirstName', value)}
                placeholder="Jane"
                autoCapitalize="words"
              />
              {errors.adminFirstName ? <Text style={styles.errorText}>{errors.adminFirstName}</Text> : null}
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={[styles.input, errors.adminLastName && styles.inputError]}
                value={form.adminLastName}
                onChangeText={value => updateField('adminLastName', value)}
                placeholder="Doe"
                autoCapitalize="words"
              />
              {errors.adminLastName ? <Text style={styles.errorText}>{errors.adminLastName}</Text> : null}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.adminEmail && styles.inputError]}
              value={form.adminEmail}
              onChangeText={value => updateField('adminEmail', value)}
              placeholder="admin@acme.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.adminEmail ? <Text style={styles.errorText}>{errors.adminEmail}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={form.password}
                onChangeText={value => updateField('password', value)}
                secureTextEntry={!showPassword}
                placeholder="Enter a secure password"
              />
              <TouchableOpacity onPress={() => setShowPassword(value => !value)} style={styles.eyeButton}>
                {showPassword ? <EyeOff size={18} color={colors.slate[500]} /> : <Eye size={18} color={colors.slate[500]} />}
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={form.confirmPassword}
                onChangeText={value => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm your password"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(value => !value)} style={styles.eyeButton}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.slate[500]} /> : <Eye size={18} color={colors.slate[500]} />}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password requirements</Text>
            <Text style={styles.requirementText}>• At least 8 characters</Text>
            <Text style={styles.requirementText}>• One uppercase letter</Text>
            <Text style={styles.requirementText}>• One lowercase letter</Text>
            <Text style={styles.requirementText}>• One number</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>{loading ? 'Creating organisation...' : 'Create organisation'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxl },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.lg },
  backText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  eyebrow: { color: colors.pink[800], fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  fieldRow: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  fieldGroup: { marginBottom: spacing.lg },
  label: { color: colors.slate[700], fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 12,
    height: 54,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    color: colors.slate[900],
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 12,
    backgroundColor: colors.white,
    height: 54,
    paddingHorizontal: spacing.md,
  },
  passwordInput: { flex: 1, color: colors.slate[900], fontSize: 16 },
  eyeButton: { marginLeft: spacing.sm },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  requirementsBox: {
    backgroundColor: colors.white,
    borderColor: colors.slate[200],
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  requirementsTitle: { color: colors.slate[800], fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  requirementText: { color: colors.slate[600], fontSize: 12, lineHeight: 20 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.pink[800],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default CreateAdminAccountScreen;
