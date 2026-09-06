import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import AppSafeArea from '../components/AppSafeArea';

const OnboardingTwo = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  return (
    <AppSafeArea style={styles.container}>
      <View style={[styles.imageContainer, { height: height * 0.55 }]}>
        <Image
          source={require('../../assets/scan2-onboarding.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
      
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Fast & Seamless Check-In</Text>
        <Text style={styles.description}>
          Scan your face quickly and securely to record your attendance without manual entry.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('OnboardingThree')} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  imageContainer: {
    width: '100%',
    backgroundColor: colors.pink[50],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  bottomCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.slate[200],
  },
  activeDot: {
    backgroundColor: colors.pink[900],
    width: 24,
  },
  title: {
    color: colors.slate[900],
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.slate[500],
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
    marginTop: 'auto',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.pink[900],
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.pink[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pink[50],
  },
  secondaryButtonText: {
    color: colors.pink[900],
    fontSize: 17,
    fontWeight: '700',
  },
});

export default OnboardingTwo;