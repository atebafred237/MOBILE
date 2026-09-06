import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Building2, CheckCircle2, Cpu, MapPin, Settings2, Users } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';
import { getOrganizationSetupChecklist } from '../services/organizationService';

const setupItems = [
  { id: 'organization', Icon: Building2, label: 'Organisation', status: 'Completed', action: null },
  { id: 'departments', Icon: Users, label: 'Departments', status: 'Not completed', action: 'Add department' },
  { id: 'employees', Icon: Users, label: 'Employees', status: 'Not completed', action: 'Add employees' },
  { id: 'devices', Icon: Cpu, label: 'Devices & Kiosks', status: 'Not completed', action: 'Register device' },
  { id: 'attendance', Icon: Settings2, label: 'Attendance settings', status: 'Not completed', action: 'Configure' },
];

const OrganisationSetupScreen = ({ navigation }) => {
  const handleAction = itemId => {
    if (itemId === 'departments') {
      navigation.navigate('AdminRoot', { screen: 'AdminManagement', params: { tab: 'departments' } });
      return;
    }

    if (itemId === 'employees') {
      navigation.navigate('AdminRoot', { screen: 'AdminManagement', params: { tab: 'employees' } });
      return;
    }

    if (itemId === 'devices') {
      navigation.navigate('AdminRoot', { screen: 'AdminManagement', params: { tab: 'kiosks' } });
      return;
    }

    if (itemId === 'attendance') {
      navigation.navigate('AdminRoot', { screen: 'AdminAttendance' });
      return;
    }

    navigation.goBack();
  };

  return (
    <AppSafeArea style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>SETUP</Text>
        <Text style={styles.title}>Complete your organisation setup</Text>
        <Text style={styles.subtitle}>Follow these steps to get PRESENZA ready.</Text>

        <View style={styles.list}>
          {setupItems.map(item => {
            const Icon = item.Icon;
            const completed = item.status === 'Completed';

            return (
              <TouchableOpacity key={item.id} style={[styles.card, completed && styles.cardCompleted]} onPress={() => handleAction(item.id)} activeOpacity={0.9}>
                <View style={[styles.iconWrap, completed ? styles.iconWrapCompleted : styles.iconWrapPending]}>
                  {completed ? <CheckCircle2 size={20} color={colors.green[700]} /> : <Icon size={20} color={colors.pink[800]} />}
                </View>
                <View style={styles.copy}>
                  <Text style={styles.itemTitle}>{item.label}</Text>
                  <Text style={[styles.itemStatus, completed ? styles.itemStatusCompleted : styles.itemStatusPending]}>{item.status}</Text>
                </View>
                {item.action ? (
                  <View style={styles.actionRow}>
                    <Text style={styles.actionText}>{item.action}</Text>
                    <ArrowRight size={16} color={colors.pink[800]} />
                  </View>
                ) : (
                  <View style={styles.completedPill}><Text style={styles.completedPillText}>Completed</Text></View>
                )}
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
  content: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxl },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.lg },
  backText: { color: colors.pink[900], fontSize: 15, fontWeight: '700' },
  eyebrow: { color: colors.pink[800], fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
    padding: spacing.md,
  },
  cardCompleted: { borderColor: colors.green[200], backgroundColor: colors.green[50] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapCompleted: { backgroundColor: colors.green[100] },
  iconWrapPending: { backgroundColor: colors.pink[50] },
  copy: { flex: 1 },
  itemTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '700' },
  itemStatus: { fontSize: 12, marginTop: 3 },
  itemStatusCompleted: { color: colors.green[700], fontWeight: '700' },
  itemStatusPending: { color: colors.slate[500] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.sm },
  actionText: { color: colors.pink[800], fontSize: 12, fontWeight: '700' },
  completedPill: { backgroundColor: colors.green[100], paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999 },
  completedPillText: { color: colors.green[700], fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

export default OrganisationSetupScreen;
