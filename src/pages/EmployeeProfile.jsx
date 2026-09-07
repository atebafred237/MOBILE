import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  Modal, 
  Pressable,
  Alert,
  Platform 
} from 'react-native';
import { 
  Camera, 
  Check, 
  Edit3, 
  Mail, 
  MapPin, 
  Phone, 
  UserRound, 
  Image as ImageIcon, 
  Eye, 
  X 
} from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { useAuth, getProfileAvatarUri } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import ProfileAvatar from '../components/ProfileAvatar';

const EmployeeProfile = () => {
  const { user, updateProfile, updateProfilePicture } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [editing, setEditing] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Use the canonical employee reference photo when available, but keep a local preview until the server confirms the upload.
  const currentAvatarUri = localAvatarUri || getProfileAvatarUri(user, user?.name || 'User');
  console.log('🔥 CURRENT AVATAR URI:', currentAvatarUri);
  console.log('🔥 CURRENT USER:', JSON.stringify(user, null, 2));

  // Pick from Gallery
  const handlePickFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Photo Access Needed',
            'Please grant permission to access your photo library in settings.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      setShowOptionsModal(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setLocalAvatarUri(selectedUri); // Instant visual update in circle
        setUploadingAvatar(true);
        const resultData = await updateProfilePicture(selectedUri);
          if (resultData?.success) {
            // Upload succeeded - clear local preview so component uses refreshed user data from AuthContext
            setLocalAvatarUri(null);
          } else {
            // Upload failed - clear preview to show fallback avatar
            setLocalAvatarUri(null);
            Alert.alert('Upload Failed', resultData?.error || 'Failed to update profile picture');
          }
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      setShowOptionsModal(false);
      Alert.alert('Error', 'Unable to open gallery. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Take photo with Camera
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Camera Access Needed',
            'Please grant permission to use the camera in settings.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      setShowOptionsModal(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        setLocalAvatarUri(capturedUri); // Instant visual update in circle
        setUploadingAvatar(true);
        const resultData = await updateProfilePicture(capturedUri);
          if (resultData?.success) {
            // Upload succeeded - clear local preview so component uses refreshed user data from AuthContext
            setLocalAvatarUri(null);
          } else {
            // Upload failed - clear preview to show fallback avatar
            setLocalAvatarUri(null);
            Alert.alert('Upload Failed', resultData?.error || 'Failed to update profile picture');
          }
      }
    } catch (err) {
      console.warn('Camera take error:', err);
      setShowOptionsModal(false);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
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
      {/* ── WhatsApp-Style Header Cover & Avatar ── */}
      <View style={styles.cover}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity 
            activeOpacity={0.85} 
            onPress={() => setShowOptionsModal(true)}
            style={styles.avatarTouch}
          >
            <View style={styles.avatarRing}>
              <ProfileAvatar uri={currentAvatarUri} name={user?.name} style={styles.avatar} />
              {uploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.avatarLoadingText}>Updating...</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* WhatsApp-Style Floating Camera Badge */}
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={() => setShowOptionsModal(true)} 
            disabled={uploadingAvatar}
            accessibilityLabel="Change profile picture"
          >
            <Camera size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user?.name || 'Employee'}</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.status}>{t('available')}</Text>
        </View>
        <Text style={styles.role}>{user?.position || 'Staff member'}  ·  {user?.department || 'General'}</Text>
      </View>

      {/* ── Contact Info Card ── */}
      <View style={[styles.infoCard, isDark && styles.darkCard]}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, isDark && styles.darkPrimaryText]}>{t('contactInfo')}</Text>
          <Text style={styles.sectionCaption}>Personal details</Text>
        </View>
        <View style={styles.infoRow}>
          <Mail size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('email')}</Text>
            {editing === 'email' ? (
              <TextInput style={styles.editInput} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoFocus />
            ) : (
              <Text style={styles.infoValue}>{email || 'Not set'}</Text>
            )}
          </View>
          {renderEditAction('email')}
        </View>
        <View style={styles.infoRow}>
          <Phone size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('phone')}</Text>
            {editing === 'phone' ? (
              <TextInput style={styles.editInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoFocus />
            ) : (
              <Text style={styles.infoValue}>{phone || 'Not set'}</Text>
            )}
          </View>
          {renderEditAction('phone')}
        </View>
        <View style={styles.infoRow}>
          <MapPin size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('department')}</Text>
            <Text style={styles.infoValue}>{user?.department || 'Not assigned'}</Text>
          </View>
        </View>
      </View>

      {/* ── Work Profile Card ── */}
      <View style={[styles.infoCard, isDark && styles.darkCard]}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, isDark && styles.darkPrimaryText]}>{t('about')}</Text>
          <Text style={styles.sectionCaption}>Work profile</Text>
        </View>
        <View style={styles.infoRow}>
          <UserRound size={21} color={colors.slate[600]} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('position')}</Text>
            <Text style={styles.infoValue}>{user?.position || 'Not assigned'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.idIcon}>#</Text>
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>{t('employeeId')}</Text>
            <Text style={styles.infoValue}>{user?.matricule || 'Not assigned'}</Text>
          </View>
        </View>
      </View>

      {/* ── WhatsApp-Style Action Sheet Modal ── */}
      <Modal 
        visible={showOptionsModal} 
        transparent={true} 
        animationType="slide" 
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            activeOpacity={1} 
            onPress={() => setShowOptionsModal(false)} 
          />
          <View style={[styles.actionSheet, isDark && styles.darkSheet]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, isDark && styles.darkPrimaryText]}>Profile photo</Text>
            
            <View style={styles.sheetOptionsRow}>
              {/* Option 1: Camera */}
              <TouchableOpacity 
                style={styles.sheetOption} 
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#00a884' }]}>
                  <Camera size={26} color={colors.white} />
                </View>
                <Text style={[styles.sheetOptionLabel, isDark && styles.darkSubText]}>Camera</Text>
              </TouchableOpacity>

              {/* Option 2: Gallery */}
              <TouchableOpacity 
                style={styles.sheetOption} 
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#0284c7' }]}>
                  <ImageIcon size={26} color={colors.white} />
                </View>
                <Text style={[styles.sheetOptionLabel, isDark && styles.darkSubText]}>Gallery</Text>
              </TouchableOpacity>

              {/* Option 3: View Photo */}
              <TouchableOpacity 
                style={styles.sheetOption} 
                onPress={() => {
                  setShowOptionsModal(false);
                  setShowViewModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#64748b' }]}>
                  <Eye size={26} color={colors.white} />
                </View>
                <Text style={[styles.sheetOptionLabel, isDark && styles.darkSubText]}>View photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.sheetCancelBtn, isDark && styles.darkCancelBtn]} 
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Photo Viewer Modal ── */}
      <Modal 
        visible={showViewModal} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.fullscreenViewer}>
          <TouchableOpacity 
            style={styles.closeViewerBtn} 
            onPress={() => setShowViewModal(false)}
          >
            <X size={28} color={colors.white} />
          </TouchableOpacity>
          
          <ProfileAvatar
            uri={currentAvatarUri}
            name={user?.name}
            style={styles.fullscreenImage} 
            resizeMode="contain" 
          />
          <Text style={styles.fullscreenName}>{user?.name || 'Profile Picture'}</Text>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f5' },
  darkContainer: { backgroundColor: colors.slate[900] },
  darkCard: { backgroundColor: colors.slate[800], borderColor: colors.slate[700] },
  darkPrimaryText: { color: colors.white },
  darkSubText: { color: colors.slate[300] },
  darkSheet: { backgroundColor: colors.slate[800] },
  darkCancelBtn: { backgroundColor: colors.slate[700] },
  content: { paddingBottom: spacing.xl },
  cover: { backgroundColor: colors.slate[900], alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarWrap: { position: 'relative' },
  avatarTouch: { borderRadius: 72 },
  avatarRing: { padding: 4, borderRadius: 72, backgroundColor: colors.white, position: 'relative', overflow: 'hidden' },
  avatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: colors.slate[200] },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLoadingText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  // WhatsApp Green style camera badge on bottom-right of avatar
  cameraButton: { 
    position: 'absolute', 
    right: 2, 
    bottom: 2, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#00a884', 
    borderWidth: 3.5, 
    borderColor: colors.white, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  name: { color: colors.white, fontSize: 23, fontWeight: '800', marginTop: spacing.md },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.16)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green[500], marginRight: 6 },
  status: { color: colors.green[200], fontSize: 12, fontWeight: '700' },
  role: { color: colors.slate[400], fontSize: 13, marginTop: 8 },
  infoCard: { backgroundColor: colors.white, marginTop: spacing.md, marginHorizontal: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.slate[200] },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.slate[900], fontSize: 16, fontWeight: '800' },
  sectionCaption: { color: colors.slate[400], fontSize: 11 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.slate[100] },
  infoCopy: { flex: 1, marginLeft: spacing.md },
  infoLabel: { color: colors.slate[500], fontSize: 12 },
  infoValue: { color: colors.slate[800], fontSize: 15, marginTop: 2, fontWeight: '500' },
  editInput: { color: colors.slate[800], fontSize: 15, marginTop: 2, paddingVertical: 2, borderBottomWidth: 1.5, borderBottomColor: colors.pink[900] },
  idIcon: { width: 21, color: colors.slate[600], fontSize: 20, fontWeight: '700', textAlign: 'center' },
  
  // WhatsApp Action Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate[300],
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  sheetOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  sheetOption: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[700],
  },
  sheetCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate[700],
  },

  // Fullscreen Photo Viewer
  fullscreenViewer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeViewerBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
    borderRadius: 16,
  },
  fullscreenName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.xl,
  },
});

export default EmployeeProfile;

