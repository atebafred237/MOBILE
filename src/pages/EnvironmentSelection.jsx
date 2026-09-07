import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Building2, GraduationCap, Landmark, UsersRound } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import AppSafeArea from '../components/AppSafeArea';

const environments = [
  {
    id: 'it_company',
    title: 'IT Company',
    status: 'AVAILABLE',
    description: 'Manage employee attendance and company workforce records.',
    icon: Building2,
    available: true,
  },
  {
    id: 'school',
    title: 'School',
    status: 'COMING SOON',
    description: 'Manage student, teacher and staff attendance.',
    icon: GraduationCap,
    message: 'School environment coming soon',
    detail: "Presenza for schools is currently under development. We'll make it available in a future update.",
  },
  {
    id: 'organization',
    title: 'Organization',
    status: 'COMING SOON',
    description: 'Manage attendance for members, staff and teams.',
    icon: Landmark,
    message: 'Organization environment coming soon',
    detail: "Presenza for organizations is currently under development. We'll make it available in a future update.",
  },
  {
    id: 'business',
    title: 'Business / Enterprise',
    status: 'COMING SOON',
    description: 'Manage workforce attendance across your business.',
    icon: UsersRound,
    message: 'Business environment coming soon',
    detail: 'This Presenza environment is currently under development. We\'ll make it available in a future update.',
  },
];

const EnvironmentSelection = ({ navigation }) => {
  const { selectEnvironment, completeOnboarding } = useAuth();

  const chooseEnvironment = async (environment) => {
    if (!environment.available) {
      Alert.alert(environment.message, environment.detail, [{ text: 'Got it' }]);
      return;
    }
    await selectEnvironment(environment.id);
    await completeOnboarding();
    navigation.navigate('AccessOptions');
  };

  return (
    <AppSafeArea style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>PRESENZA</Text>
        <Text style={styles.title}>Where are you using Presenza?</Text>
        <Text style={styles.subtitle}>Choose your environment to get an experience designed for you.</Text>
        <View style={styles.list}>
          {environments.map((environment) => {
            const { id, title, status, description, icon: Icon, available } = environment;
            return (
            <TouchableOpacity
              key={id}
              style={[styles.card, !available && styles.cardMuted]}
              onPress={() => chooseEnvironment(environment)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, !available && styles.iconWrapMuted]}>
                <Icon size={25} color={available ? colors.pink[900] : colors.slate[500]} />
              </View>
              <View style={styles.copy}>
                <View style={styles.headingRow}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={[styles.badge, available ? styles.availableBadge : styles.soonBadge]}>{status}</Text>
                </View>
                <Text style={styles.description}>{description}</Text>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  eyebrow: { color: colors.pink[800], fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[200], borderRadius: 16, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardMuted: { opacity: 0.8 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink[50], marginRight: spacing.md },
  iconWrapMuted: { backgroundColor: colors.slate[100] },
  copy: { flex: 1 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, color: colors.slate[900], fontSize: 17, fontWeight: '700' },
  badge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  availableBadge: { color: colors.green[700] },
  soonBadge: { color: colors.slate[500] },
  description: { color: colors.slate[500], fontSize: 13, lineHeight: 19, marginTop: 5 },
});

export default EnvironmentSelection;
