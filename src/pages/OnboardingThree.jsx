import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

const OnboardingThree = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerSpacing = Math.max(spacing.sm, Math.min(spacing.lg, height * 0.03));
  const compact = height < 720;
  const illustrationWidth = Math.min(
    width - (spacing.lg * 2),
    Math.max(160, height - insets.top - insets.bottom - 190) * (4 / 3),
  );

  return (
    <SafeAreaView edges={['right', 'left']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + headerSpacing }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.pagination} accessibilityLabel="Onboarding screen 3 of 4">
          {[0, 1, 2, 3].map(index => <View key={index} style={[styles.dot, index === 2 ? styles.activeDot : styles.inactiveDot]} />)}
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.content, compact && styles.compactContent]}>
        <Text style={styles.title}>Your Attendance, Simplified</Text>
        <Text style={styles.description}>Keep every check-in secure, accurate, and easy to manage.</Text>
        <View style={[styles.illustrationFrame, { width: illustrationWidth }, compact && styles.compactIllustration]}>
          <Image
            source={require('../../assets/scan3.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} hitSlop={12}>
          <Text style={styles.next}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 24, flex: 1, overflow: 'hidden', paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg },
  skip: { color: colors.pink[900], fontSize: 15, fontWeight: '600' },
  pagination: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  dot: { borderRadius: 4, height: 8, width: 8 },
  activeDot: { backgroundColor: colors.pink[900] },
  inactiveDot: { backgroundColor: colors.slate[200] },
  headerSpacer: { width: 30 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: spacing.xl },
  compactContent: { paddingBottom: spacing.md },
  title: { color: colors.slate[900], fontSize: 25, fontWeight: '700', textAlign: 'center' },
  description: { color: colors.slate[500], fontSize: 15, lineHeight: 23, marginTop: spacing.md, maxWidth: 330, textAlign: 'center' },
  illustrationFrame: { alignItems: 'center', aspectRatio: 4 / 3, backgroundColor: 'transparent', justifyContent: 'center', marginTop: spacing.xl, overflow: 'visible' },
  compactIllustration: { marginTop: spacing.md },
  illustration: { alignSelf: 'center', height: '112%', width: '112%' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md },
  back: { color: colors.pink[900], fontSize: 16, fontWeight: '700' },
  next: { color: colors.pink[900], fontSize: 16, fontWeight: '700' },
});

export default OnboardingThree;