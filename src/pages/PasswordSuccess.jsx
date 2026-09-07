import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import AppSafeArea from '../components/AppSafeArea';

const CONFETTI = [
  { left: '8%', delay: 0, color: colors.pink[800], size: 12, rotate: '20deg' },
  { left: '23%', delay: 650, color: colors.orange[500], size: 16, rotate: '-25deg' },
  { left: '41%', delay: 250, color: colors.pink[900], size: 10, rotate: '45deg' },
  { left: '58%', delay: 900, color: colors.green[600], size: 14, rotate: '-15deg' },
  { left: '74%', delay: 400, color: colors.orange[600], size: 11, rotate: '30deg' },
  { left: '90%', delay: 1100, color: colors.pink[800], size: 15, rotate: '-35deg' },
];

const FallingConfetti = ({ left, delay, color, size, rotate }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        {
          left,
          width: size,
          height: size * 1.8,
          backgroundColor: color,
          opacity: progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-60, 850] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [rotate, '260deg'] }) },
          ],
        },
      ]}
    />
  );
};

const PasswordSuccess = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  return (
    <AppSafeArea style={styles.container}>
      <View pointerEvents="none" style={styles.confettiLayer}>
        {CONFETTI.map(piece => <FallingConfetti key={piece.left} {...piece} />)}
      </View>

      <Image
        source={require('../../assets/new logo transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.card}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.eyebrow}>Great job!</Text>
        <Text style={styles.title}>{t('passwordSuccess')}</Text>
        <Text style={styles.subtitle}>
          {t('passwordSuccessSubtitle')}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('SignIn')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{t('continueSignIn')}</Text>
        </TouchableOpacity>
      </View>
    </AppSafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    overflow: 'hidden',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 3,
  },
  logo: {
    alignSelf: 'center',
    aspectRatio: 1254 / 303,
    marginBottom: -50,
    maxWidth: 260,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginBottom: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green[50],
    borderWidth: 2,
    borderColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  checkmark: {
    color: colors.green[600],
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    color: colors.slate[900],
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.green[600],
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.slate[500],
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    width: '100%',
    backgroundColor: colors.pink[800],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PasswordSuccess;
