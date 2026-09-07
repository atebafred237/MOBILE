import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import AppSafeArea from '../components/AppSafeArea';

const CompanySetup = ({ navigation, route }) => {
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const { setCompanySubscription } = useAuth();
  const subscriptionStatus = route.params?.subscriptionStatus || 'trial';
  const plan = route.params?.plan;

  const continueToLogin = async () => {
    if (!companyName.trim()) {
      setError('Enter your company name to continue.');
      return;
    }
    await setCompanySubscription(subscriptionStatus);
    navigation.navigate('SignIn', { companyName: companyName.trim(), plan });
  };

  return (
    <AppSafeArea style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>Back</Text></TouchableOpacity>
          <View style={styles.iconWrap}><Building2 size={28} color={colors.pink[900]} /></View>
          <Text style={styles.eyebrow}>COMPANY SETUP</Text>
          <Text style={styles.title}>Create your company workspace</Text>
          <Text style={styles.subtitle}>Set up the company account first, then sign in with the CEO account to open your dashboard.</Text>
          <Text style={styles.label}>Company name</Text>
          <TextInput style={styles.input} value={companyName} onChangeText={(value) => { setCompanyName(value); setError(''); }} placeholder="Acme Technologies" autoCapitalize="words" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={continueToLogin}><Text style={styles.buttonText}>Continue to sign in</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  flex: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.xl },
  backText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50], marginBottom: spacing.lg },
  eyebrow: { color: colors.pink[800], fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  label: { color: colors.slate[700], fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  input: { height: 54, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[300], borderRadius: 10, paddingHorizontal: spacing.md, color: colors.slate[900], fontSize: 16 },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  button: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[900], marginTop: spacing.xl },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default CompanySetup;
