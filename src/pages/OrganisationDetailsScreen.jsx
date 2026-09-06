import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { colors, spacing } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppSafeArea from '../components/AppSafeArea';
import { getOrganizationDraft, saveOrganizationDraft } from '../services/organizationService';

const validateEmail = value => /^\S+@\S+\.\S+$/.test(value.trim());

const dayOptions = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const formatTime = date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const OrganisationDetailsScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    organisationName: '',
    organisationEmail: '',
    phone: '',
    location: '',
    logoUri: '',
    workingDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '17:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [timePicker, setTimePicker] = useState(null);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getOrganizationDraft();
      if (draft) {
        setForm({
          organisationName: draft.organisationName || '',
          organisationEmail: draft.organisationEmail || '',
          phone: draft.phone || '',
          location: draft.location || '',
          logoUri: draft.logoUri || '',
          workingDays: draft.workingDays || [1, 2, 3, 4, 5],
          startTime: draft.startTime || '08:00',
          endTime: draft.endTime || '17:00',
          timezone: draft.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
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

    if (!form.organisationName.trim()) {
      nextErrors.organisationName = 'Organisation name is required.';
    }

    if (form.organisationEmail.trim() && !validateEmail(form.organisationEmail)) {
      nextErrors.organisationEmail = 'Please enter a valid email address.';
    }

    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 7) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const draft = (await getOrganizationDraft()) || {};
      const nextDraft = {
        ...draft,
        ...form,
        organisationName: form.organisationName.trim(),
        organisationEmail: form.organisationEmail.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      };
      await saveOrganizationDraft(nextDraft);
      navigation.navigate('CreateAdminAccountScreen');
    } finally {
      setLoading(false);
    }
  };

  const chooseLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const logoUri = result.assets[0].uri;
      setForm(current => ({ ...current, logoUri }));
      const draft = (await getOrganizationDraft()) || {};
      await saveOrganizationDraft({ ...draft, logoUri });
    }
  };

  const toggleWorkingDay = day => {
    setForm(current => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter(value => value !== day)
        : [...current.workingDays, day].sort((a, b) => a - b),
    }));
  };

  const chooseTime = picker => {
    setTimePicker(picker);
  };

  const handleTimeChange = async (event, date) => {
    const picker = timePicker;
    setTimePicker(null);
    if (!date || event?.type === 'dismissed') return;

    const value = formatTime(date);
    setForm(current => ({ ...current, [picker === 'start' ? 'startTime' : 'endTime']: value }));
  };

  return (
    <AppSafeArea style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>ORGANISATION</Text>
          <Text style={styles.title}>Tell us about your organisation</Text>
          <Text style={styles.subtitle}>Enter a few details to get your PRESENZA workspace ready.</Text>

          <TouchableOpacity style={styles.logoPicker} onPress={chooseLogo} activeOpacity={0.85}>
            {form.logoUri ? <Image source={{ uri: form.logoUri }} style={styles.logoPreview} /> : <Text style={styles.logoPickerText}>Add organisation logo</Text>}
          </TouchableOpacity>

          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Working hours</Text>
            <Text style={styles.sectionSubtitle}>Choose the days and local hours used for attendance.</Text>
            <View style={styles.daysGrid}>
              {dayOptions.map(day => {
                const selected = form.workingDays.includes(day.value);
                return (
                  <TouchableOpacity key={day.value} style={[styles.dayOption, selected && styles.dayOptionSelected]} onPress={() => toggleWorkingDay(day.value)} activeOpacity={0.8}>
                    <Text style={[styles.dayOptionText, selected && styles.dayOptionTextSelected]}>{day.label.slice(0, 3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.timeRow}>
              <TouchableOpacity style={styles.timeField} onPress={() => chooseTime('start')}>
                <Text style={styles.timeLabel}>Start</Text><Text style={styles.timeValue}>{form.startTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeField} onPress={() => chooseTime('end')}>
                <Text style={styles.timeLabel}>End</Text><Text style={styles.timeValue}>{form.endTime}</Text>
              </TouchableOpacity>
            </View>
            {timePicker ? <DateTimePicker value={new Date(`1970-01-01T${timePicker === 'start' ? form.startTime : form.endTime}:00`)} mode="time" is24Hour display="default" onChange={handleTimeChange} /> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Organisation name</Text>
            <TextInput
              style={[styles.input, errors.organisationName && styles.inputError]}
              value={form.organisationName}
              onChangeText={value => updateField('organisationName', value)}
              placeholder="Acme Holdings"
              autoCapitalize="words"
            />
            {errors.organisationName ? <Text style={styles.errorText}>{errors.organisationName}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Organisation email</Text>
            <TextInput
              style={[styles.input, errors.organisationEmail && styles.inputError]}
              value={form.organisationEmail}
              onChangeText={value => updateField('organisationEmail', value)}
              placeholder="hello@acme.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.organisationEmail ? <Text style={styles.errorText}>{errors.organisationEmail}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={form.phone}
              onChangeText={value => updateField('phone', value)}
              placeholder="+1 234 567 890"
              keyboardType="phone-pad"
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={value => updateField('location', value)}
              placeholder="London, United Kingdom"
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleContinue} disabled={loading} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>{loading ? 'Please wait...' : 'Continue'}</Text>
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
  title: { color: colors.slate[900], fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
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
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  primaryButton: {
    height: 54,
    backgroundColor: colors.pink[800],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  logoPicker: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: colors.pink[300], backgroundColor: colors.pink[50], alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.xl, overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%' },
  logoPickerText: { color: colors.pink[900], fontSize: 11, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  scheduleSection: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 14, padding: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { color: colors.slate[900], fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { color: colors.slate[500], fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dayOption: { minWidth: 42, height: 36, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  dayOptionSelected: { backgroundColor: colors.pink[800], borderColor: colors.pink[800] },
  dayOptionText: { color: colors.slate[600], fontSize: 12, fontWeight: '700' },
  dayOptionTextSelected: { color: colors.white },
  timeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  timeField: { flex: 1, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 10, padding: spacing.sm },
  timeLabel: { color: colors.slate[500], fontSize: 11, fontWeight: '700' },
  timeValue: { color: colors.slate[900], fontSize: 17, fontWeight: '800', marginTop: 3 },
});

export default OrganisationDetailsScreen;
