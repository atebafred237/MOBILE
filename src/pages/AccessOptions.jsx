import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, CheckCircle2, CreditCard, Sparkles } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';

const AccessOptions = ({ navigation }) => {
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('EnvironmentSelection');
  };

  return (
    <AppSafeArea style={styles.container}>
    <View style={styles.content}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>IT COMPANY</Text>
      <Text style={styles.title}>Get started with Presenza</Text>
      <Text style={styles.subtitle}>Choose how you'd like to use Presenza for your company.</Text>
      <View style={styles.options}>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('OrganisationDetailsScreen')} activeOpacity={0.85}>
          <View style={[styles.iconWrap, styles.trialIcon]}><Sparkles size={24} color={colors.pink[900]} /></View>
          <View style={styles.copy}><Text style={styles.optionTitle}>Try your 30 days free trial</Text><Text style={styles.optionDescription}>Experience Presenza and explore smart attendance management before subscribing.</Text></View>
          <ArrowRight size={20} color={colors.pink[900]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('PricingPlans')} activeOpacity={0.85}>
          <View style={[styles.iconWrap, styles.planIcon]}><CreditCard size={24} color={colors.blue[700]} /></View>
          <View style={styles.copy}><Text style={styles.optionTitle}>View Plans</Text><Text style={styles.optionDescription}>Choose a plan that fits your company's attendance needs.</Text></View>
          <ArrowRight size={20} color={colors.blue[700]} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.existingAccount} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.existingAccountText}>I already have a company account</Text>
      </TouchableOpacity>
      <View style={styles.note}><CheckCircle2 size={18} color={colors.green[600]} /><Text style={styles.noteText}>Your existing company login remains the same.</Text></View>
    </View>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  content: { flex: 1, padding: spacing.xl },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.xl },
  backText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  eyebrow: { color: colors.pink[800], fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  options: { gap: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 16, padding: spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  trialIcon: { backgroundColor: colors.pink[50] },
  planIcon: { backgroundColor: colors.blue[50] },
  copy: { flex: 1, marginRight: spacing.sm },
  optionTitle: { color: colors.slate[900], fontSize: 17, fontWeight: '700', marginBottom: 5 },
  optionDescription: { color: colors.slate[500], fontSize: 13, lineHeight: 19 },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  existingAccount: { alignItems: 'center', paddingVertical: spacing.lg },
  existingAccountText: { color: colors.pink[900], fontSize: 14, fontWeight: '700' },
  noteText: { flex: 1, color: colors.slate[600], fontSize: 13 },
});

export default AccessOptions;
