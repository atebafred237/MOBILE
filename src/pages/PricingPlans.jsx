import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  Clock3,
  FileBarChart,
  Fingerprint,
  Globe2,
  KeyRound,
  Laptop,
  ListChecks,
  LockKeyhole,
  MessageSquareMore,
  Network,
  QrCode,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Users,
  WalletCards,
} from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';

const plan = {
  name: 'PRESENZA Business',
  price: '15,000 FCFA',
  billingPeriod: '/ month',
  status: 'available',
  subscription_enabled: false,
  payment_enabled: false,
};

const featureGroups = [
  {
    title: 'Workforce & organisation',
    icon: Building2,
    features: [
      'Employee & participant management',
      'Organization management',
      'Department management',
      'Kiosk/device management',
      'Organization logo/branding',
      'Organization/tenant data isolation',
    ],
  },
  {
    title: 'Attendance intelligence',
    icon: CalendarCheck,
    features: [
      'QR-code attendance',
      'Face-recognition attendance',
      'Check-in & check-out',
      'Working hours & schedules',
      'Automatic late detection',
      'Automatic absence marking',
      'Hours-worked tracking',
      'Employee attendance monitoring',
    ],
  },
  {
    title: 'Insights & operations',
    icon: BarChart3,
    features: [
      'Real-time attendance dashboard',
      'Attendance history',
      'Attendance statistics',
      'Attendance reports',
      'Notifications',
      'Attendance audit logs',
      'Onboarding/setup guidance',
    ],
  },
  {
    title: 'Access & security',
    icon: ShieldCheck,
    features: [
      'Secure authentication',
      'Role-based access control',
      'Web access',
      'Mobile access',
      'API/integration capability',
    ],
  },
];

const featureIcons = [QrCode, ScanFace, Fingerprint, Clock3, FileBarChart, Users, KeyRound, Globe2, Laptop, Smartphone, Network, MessageSquareMore, LockKeyhole, BadgeCheck, ListChecks, WalletCards];

const PricingPlans = ({ navigation }) => {
  let featureIndex = 0;

  return (
    <AppSafeArea style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <ArrowLeft size={18} color={colors.pink[800]} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PLANS & PRICING</Text>
          <Text style={styles.title}>One complete plan. Everything included.</Text>
          <Text style={styles.subtitle}>
            PRESENZA Business brings your attendance, people, devices, and insights together in one workspace.
          </Text>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.badge}>
              <Check size={13} color={colors.pink[900]} strokeWidth={3} />
              <Text style={styles.badgeText}>ALL-IN-ONE PLAN</Text>
            </View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.description}>The complete PRESENZA solution for modern attendance management.</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.billingPeriod}>{plan.billingPeriod}</Text>
            </View>
          </View>

          <View style={styles.statusBanner}>
            <WalletCards size={20} color={colors.pink[800]} />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Subscription coming soon</Text>
              <Text style={styles.statusText}>Online subscription and payment options will be available in a future release.</Text>
            </View>
          </View>

          <View style={styles.featuresHeader}>
            <View style={styles.featuresIcon}><BadgeCheck size={19} color={colors.white} /></View>
            <View>
              <Text style={styles.featuresTitle}>Everything included</Text>
              <Text style={styles.featuresSubtitle}>No feature tiers. No complicated choices.</Text>
            </View>
          </View>

          <View style={styles.featureGroups}>
            {featureGroups.map(group => {
              const GroupIcon = group.icon;
              return (
                <View key={group.title} style={styles.featureGroup}>
                  <View style={styles.groupTitleRow}>
                    <GroupIcon size={18} color={colors.pink[800]} />
                    <Text style={styles.groupTitle}>{group.title}</Text>
                  </View>
                  <View style={styles.featureList}>
                    {group.features.map(feature => {
                      const FeatureIcon = featureIcons[featureIndex++ % featureIcons.length];
                      return (
                        <View key={feature} style={styles.featureRow}>
                          <View style={styles.featureCheck}><FeatureIcon size={14} color={colors.pink[800]} /></View>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.noActionNotice}>
            <Text style={styles.noActionText}>Viewing only. No subscription or payment action is available yet.</Text>
          </View>
        </View>
      </ScrollView>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.lg },
  backText: { color: colors.pink[800], fontSize: 15, fontWeight: '700' },
  hero: { marginBottom: spacing.lg },
  eyebrow: { color: colors.pink[800], fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 31, lineHeight: 38, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24 },
  planCard: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.pink[800], borderRadius: 18, overflow: 'hidden', shadowColor: colors.pink[800], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4 },
  planHeader: { padding: spacing.lg, backgroundColor: colors.pink[50] },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.white, marginBottom: spacing.md },
  badgeText: { color: colors.pink[900], fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  planName: { color: colors.slate[900], fontSize: 25, fontWeight: '800' },
  description: { color: colors.slate[600], fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  price: { color: colors.pink[900], fontSize: 30, fontWeight: '900' },
  billingPeriod: { color: colors.slate[600], fontSize: 15, fontWeight: '600', marginLeft: spacing.xs },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.lg, padding: spacing.md, borderRadius: 12, backgroundColor: colors.slate[50], borderWidth: 1, borderColor: colors.slate[200] },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.slate[900], fontSize: 14, fontWeight: '800' },
  statusText: { color: colors.slate[500], fontSize: 12, lineHeight: 18, marginTop: 2 },
  featuresHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  featuresIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[800] },
  featuresTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '800' },
  featuresSubtitle: { color: colors.slate[500], fontSize: 12, marginTop: 2 },
  featureGroups: { paddingHorizontal: spacing.lg },
  featureGroup: { borderTopWidth: 1, borderTopColor: colors.slate[200], paddingVertical: spacing.md },
  groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  groupTitle: { color: colors.slate[800], fontSize: 14, fontWeight: '800' },
  featureList: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50] },
  featureText: { flex: 1, color: colors.slate[700], fontSize: 13, lineHeight: 18 },
  noActionNotice: { margin: spacing.lg, marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.slate[200] },
  noActionText: { color: colors.slate[500], fontSize: 12, lineHeight: 18, textAlign: 'center' },
});

export default PricingPlans;
