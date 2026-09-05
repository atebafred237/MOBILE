import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';

const ChangePassword = () => {
  const { token, completePasswordChange } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('password123');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: confirmation,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not update your password.');
      await completePasswordChange();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppSafeArea>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <Text style={styles.title}>Change your password</Text>
          <Text style={styles.subtitle}>For security, replace the temporary password before continuing.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Current password</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Text style={styles.label}>New password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoFocus />
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput style={styles.input} value={confirmation} onChangeText={setConfirmation} secureTextEntry onSubmitEditing={submit} />
          <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Update password</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, borderWidth: 1, borderColor: colors.slate[200], gap: spacing.sm },
  title: { color: colors.slate[900], fontSize: 23, fontWeight: '800' },
  subtitle: { color: colors.slate[500], fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  label: { color: colors.slate[700], fontSize: 13, fontWeight: '700', marginTop: spacing.sm },
  input: { height: 48, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 10, paddingHorizontal: spacing.md, color: colors.slate[900], backgroundColor: colors.slate[50] },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.pink[800], marginTop: spacing.md },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});

export default ChangePassword;
