import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

const Onboarding = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = Math.max(160, height - insets.top - insets.bottom - 190);
  const illustrationWidth = Math.min(width - (spacing.lg * 2), availableHeight * (4 / 3));

  const openOnboardingTwo = () => navigation.navigate('OnboardingTwo');
  const openSignIn = () => navigation.navigate('SignIn');

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.container}>
      <View pointerEvents="none" style={styles.waveLayer}>
        <View style={styles.waveBack} />
        <View style={styles.waveFront} />
      </View>

      <View style={styles.content}>
        <View style={styles.imageIntro}>
          <Text style={styles.imageIntroTitle}>Accurate Attendance</Text>
          <Text style={styles.imageIntroDescription}>
            Verify identity with facial recognition and record entry &amp; exit accurately
          </Text>
        </View>
        <View style={[styles.illustrationFrame, { width: illustrationWidth }]}>
          <Image
            source={require('../../assets/scan1-transparent.png')}
            style={styles.illustration}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={openOnboardingTwo} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={openSignIn} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
  },
  imageIntro: {
    alignItems: 'center',
    marginBottom: spacing.md,
    maxWidth: 320,
  },
  imageIntroTitle: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  imageIntroDescription: {
    color: colors.slate[700],
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    opacity: 0.58,
    textAlign: 'center',
  },
  logo: {
    backgroundColor: 'transparent',
    height: 196,
    width: 196,
  },
  tagline: {
    alignItems: 'center',
    marginTop: 2.5,
  },
  taglineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  taglineText: {
    color: colors.slate[800],
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    opacity: 0.62,
    textAlign: 'center',
  },
  illustrationFrame: {
    alignItems: 'center',
    aspectRatio: 4 / 3,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginTop: 0,
    overflow: 'visible',
  },
  illustration: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    height: '100%',
    width: '100%',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(131, 24, 67, 0.78)',
    borderColor: colors.pink[900],
    borderRadius: 12,
    borderWidth: 2,
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.pink[900],
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 20,
    height: 54,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.pink[900],
    fontSize: 16,
    fontWeight: '700',
  },
  waveLayer: {
    ...StyleSheet.absoluteFillObject,
    bottom: -180,
    top: undefined,
  },
  waveBack: {
    backgroundColor: colors.pink[50],
    borderRadius: 320,
    height: 360,
    position: 'absolute',
    right: -150,
    transform: [{ rotate: '-12deg' }],
    width: 620,
  },
  waveFront: {
    backgroundColor: '#fce0ed',
    borderRadius: 300,
    bottom: -44,
    height: 260,
    left: -190,
    position: 'absolute',
    transform: [{ rotate: '10deg' }],
    width: 620,
  },
});

export default Onboarding;
