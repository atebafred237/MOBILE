import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, CreditCard } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';

const plans = [
  { id: 'starter', name: 'Starter', price: 'For small teams', description: 'Attendance essentials for growing companies.' },
  { id: 'professional', name: 'Professional', price: 'For scaling teams', description: 'More control for larger workforces.', featured: true },
];

const PricingPlans = ({ navigation }) => (
  <AppSafeArea style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <Text style={styles.eyebrow}>PLANS</Text>
      <Text style={styles.title}>Choose a plan for your company</Text>
      <Text style={styles.subtitle}>Select a plan to prepare your Presenza workspace.</Text>
      <View style={styles.trialBanner}><CreditCard size={20} color={colors.pink[900]} /><Text style={styles.trialText}>Payment integration will be connected here when billing is enabled.</Text></View>
      <View style={styles.list}>
        {plans.map(plan => (
          <View key={plan.id} style={[styles.plan, plan.featured && styles.featured]}>
            {plan.featured && <Text style={styles.featuredLabel}>RECOMMENDED</Text>}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.description}>{plan.description}</Text>
            <View style={styles.features}><View style={styles.feature}><Check size={16} color={colors.green[600]} /><Text style={styles.featureText}>Attendance management</Text></View><View style={styles.feature}><Check size={16} color={colors.green[600]} /><Text style={styles.featureText}>CEO and employee access</Text></View></View>
            <TouchableOpacity style={[styles.button, plan.featured && styles.featuredButton]} onPress={() => navigation.navigate('CompanySetup', { subscriptionStatus: 'active', plan: plan.name })}><Text style={[styles.buttonText, plan.featured && styles.featuredButtonText]}>Select {plan.name}</Text></TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  </AppSafeArea>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.xl },
  backText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  eyebrow: { color: colors.pink[800], fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.lg },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.pink[50], borderRadius: 12, marginBottom: spacing.lg },
  trialText: { flex: 1, color: colors.pink[900], fontSize: 13, lineHeight: 19 },
  list: { gap: spacing.md },
  plan: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 16, padding: spacing.lg },
  featured: { borderColor: colors.pink[800], borderWidth: 2 },
  featuredLabel: { color: colors.pink[900], fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  planName: { color: colors.slate[900], fontSize: 21, fontWeight: '800' },
  price: { color: colors.pink[900], fontSize: 15, fontWeight: '700', marginTop: 4 },
  description: { color: colors.slate[500], fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  features: { gap: spacing.sm, marginTop: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { color: colors.slate[700], fontSize: 13 },
  button: { alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, backgroundColor: colors.pink[50], marginTop: spacing.lg },
  featuredButton: { backgroundColor: colors.pink[900] },
  buttonText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  featuredButtonText: { color: colors.white },
});

export default PricingPlans;
