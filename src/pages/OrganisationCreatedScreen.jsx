import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';
import { useAuth } from '../context/AuthContext';

const OrganisationCreatedScreen = ({ navigation, route }) => {
  const { completeOrganizationCreation } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleGoToDashboard = async () => {
    setSubmitting(true);
    try {
      const organizationName = route.params?.organizationName || 'Your organisation';
      const adminEmail = route.params?.adminEmail || 'admin@company.com';
      const password = route.params?.password || '';

      const result = await completeOrganizationCreation({
        organizationName,
        adminEmail,
        firstName: route.params?.firstName,
        lastName: route.params?.lastName,
        password,
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Unable to sign in to your new organisation.');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminRoot' }],
      });
    } catch (error) {
      Alert.alert('Sign-in failed', error?.message || 'Please log in with your admin account.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppSafeArea style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CheckCircle2 size={64} color={colors.green[600]} />
        </View>
        <Text style={styles.title}>Your organisation is ready!</Text>
        <Text style={styles.subtitle}>Your PRESENZA organisation has been created successfully.</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Organisation name</Text>
          <Text style={styles.value}>{route.params?.organizationName || 'Your organisation'}</Text>

          <Text style={[styles.label, styles.labelTop]}>Administrator email</Text>
          <Text style={styles.value}>{route.params?.adminEmail || 'admin@company.com'}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleGoToDashboard} disabled={submitting} activeOpacity={0.9}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Go to dashboard</Text>}
        </TouchableOpacity>
      </View>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.green[50], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  title: { color: colors.slate[900], fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: spacing.xl },
  infoCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  label: { color: colors.slate[500], fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { color: colors.slate[900], fontSize: 18, fontWeight: '700', marginTop: spacing.xs, marginBottom: spacing.md },
  labelTop: { marginTop: spacing.sm },
  primaryButton: {
    width: '100%',
    height: 54,
    backgroundColor: colors.pink[800],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default OrganisationCreatedScreen;
