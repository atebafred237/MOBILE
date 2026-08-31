import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera, Check, Edit3, Mail, MapPin, Phone, UserRound } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const EmployeeProfile = () => {
  const { user, updateProfile, updateProfilePicture } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const profile = user || {
    name: 'Employee',
    email: 'employee@example.com',
    department: 'General',
    position: 'Staff member',
    matricule: 'EMP-0001',
    phone: '+237 690 12 34 56',
    avatar: 'https://i.pravatar.cc/150?u=employee',
  };
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '+237 690 12 34 56');
  const [editing, setEditing] = useState(null);

  const pickProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await updateProfilePicture(result.assets[0].uri);
  };

  const saveField = async field => {
    await updateProfile({ [field]: field === 'email' ? email.trim() : phone.trim() });
    setEditing(null);
  };

  const renderEditAction = field => (
    <TouchableOpacity
      onPress={() => (editing === field ? saveField(field) : setEditing(field))}
      accessibilityLabel={`${editing === field ? 'Save' : 'Edit'} ${field}`}
    >
      {editing === field ? <Check size={18} color={colors.pink[900]} /> : <Edit3 size={17} color={colors.pink[900]} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, isDark && styles.darkContainer]} contentContainerStyle={styles.content}>
      <View style={styles.cover}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          </View>
          <TouchableOpacity style={styles.cameraButton} onPress={pickProfilePicture} accessibilityLabel="Change profile picture">
            <Camera size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.status}>{t('available')}</Text></View>
        <Text style={styles.role}>{profile.position}  ·  {profile.department}</Text>
      </View>

      <View style={[styles.infoCard, isDark && styles.darkCard]}>
        <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, isDark && styles.darkPrimaryText]}>{t('contactInfo')}</Text><Text style={styles.sectionCaption}>Personal details</Text></View>
        <View style={styles.infoRow}>
          <Mail size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('email')}</Text>
            {editing === 'email' ? <TextInput style={styles.editInput} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoFocus /> : <Text style={styles.infoValue}>{email}</Text>}
          </View>
          {renderEditAction('email')}
        </View>
        <View style={styles.infoRow}>
          <Phone size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('phone')}</Text>
            {editing === 'phone' ? <TextInput style={styles.editInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoFocus /> : <Text style={styles.infoValue}>{phone}</Text>}
          </View>
          {renderEditAction('phone')}
        </View>
        <View style={styles.infoRow}>
          <MapPin size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('department')}</Text>
            <Text style={styles.infoValue}>{profile.department}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.infoCard, isDark && styles.darkCard]}>
        <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, isDark && styles.darkPrimaryText]}>{t('about')}</Text><Text style={styles.sectionCaption}>Work profile</Text></View>
        <View style={styles.infoRow}>
          <UserRound size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('position')}</Text>
            <Text style={styles.infoValue}>{profile.position}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.idIcon}>#</Text>
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('employeeId')}</Text>
            <Text style={styles.infoValue}>{profile.matricule}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f5' },
  darkContainer: { backgroundColor: colors.slate[900] },
  darkCard: { backgroundColor: colors.slate[800], borderColor: colors.slate[700] },
  darkPrimaryText: { color: colors.white },
  content: { paddingBottom: spacing.xl },
  cover: { backgroundColor: colors.slate[900], alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  avatarWrap: { position: 'relative' },
  avatarRing: { padding: 4, borderRadius: 68, backgroundColor: colors.white },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.slate[200] },
  cameraButton: { position: 'absolute', right: 0, bottom: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.green[600], borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.white, fontSize: 23, fontWeight: '800', marginTop: spacing.sm },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.16)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green[500], marginRight: 5 },
  status: { color: colors.green[200], fontSize: 12, fontWeight: '700' },
  role: { color: colors.slate[400], fontSize: 12, marginTop: 8 },
  infoCard: { backgroundColor: colors.white, marginTop: spacing.md, marginHorizontal: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.slate[200] },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '800' },
  sectionCaption: { color: colors.slate[400], fontSize: 11 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate[100] },
  infoCopy: { flex: 1, marginLeft: spacing.md },
  infoLabel: { color: colors.slate[500], fontSize: 12 },
  infoValue: { color: colors.slate[800], fontSize: 15, marginTop: 2 },
  editInput: { color: colors.slate[800], fontSize: 15, marginTop: 2, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: colors.pink[900] },
  idIcon: { width: 21, color: colors.slate[600], fontSize: 20, fontWeight: '700', textAlign: 'center' },
});

export default EmployeeProfile;
