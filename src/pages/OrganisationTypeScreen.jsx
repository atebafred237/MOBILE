import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';
import { getOrganizationDraft, saveOrganizationDraft } from '../services/organizationService';

const organisationTypes = [
  {
    id: 'company',
    title: 'Company',
    description: 'Manage employees, departments, attendance and workplace devices.',
    icon: Building2,
  },
];

const OrganisationTypeScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('company');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getOrganizationDraft();
      if (draft?.organisationType) {
        setSelectedType(draft.organisationType);
      }
      setIsReady(true);
    };

    loadDraft();
  }, []);

  const continueToDetails = async () => {
    if (!selectedType) return;
    const draft = (await getOrganizationDraft()) || {};
    const nextDraft = { ...draft, organisationType: selectedType };
    await saveOrganizationDraft(nextDraft);
    navigation.navigate('OrganisationDetailsScreen');
  };

  if (!isReady) {
    return null;
  }

  return (
    <AppSafeArea style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>PRESENZA</Text>
          <Text style={styles.title}>Choose your organisation</Text>
          <Text style={styles.subtitle}>Tell us what type of organisation you're setting up.</Text>

          <View style={styles.cardList}>
            {organisationTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                    <Icon size={28} color={isSelected ? colors.white : colors.pink[800]} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{type.title}</Text>
                    <Text style={styles.cardDescription}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !selectedType && styles.primaryButtonDisabled]}
            onPress={continueToDetails}
            disabled={!selectedType}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
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
  eyebrow: { color: colors.pink[800], fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: spacing.sm },
  title: { color: colors.slate[900], fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { color: colors.slate[500], fontSize: 16, lineHeight: 24, marginBottom: spacing.xl },
  cardList: { gap: spacing.md, marginBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 18,
    padding: spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.pink[800],
    backgroundColor: colors.pink[50],
    shadowOpacity: 0.08,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.pink[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapSelected: {
    backgroundColor: colors.pink[800],
  },
  copy: { flex: 1 },
  cardTitle: { color: colors.slate[900], fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardTitleSelected: { color: colors.pink[900] },
  cardDescription: { color: colors.slate[500], fontSize: 13, lineHeight: 19 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.pink[800],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: colors.pink[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

export default OrganisationTypeScreen;
