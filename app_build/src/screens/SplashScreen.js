import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const { colors, spacing } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Hold for 1.5 seconds, then fade out and unmount
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: tokenColors.primary }]}>
          <Ionicons name="newspaper" size={48} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.text.primary }]}>News For You</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Berita Personal Terkini</Text>
        
        {/* Simple Loading Indicator */}
        <View style={styles.loaderContainer}>
          <View style={[styles.loaderDot, { backgroundColor: tokenColors.primary, opacity: 0.8 }]} />
          <View style={[styles.loaderDot, { backgroundColor: tokenColors.primary, opacity: 0.5 }]} />
          <View style={[styles.loaderDot, { backgroundColor: tokenColors.primary, opacity: 0.2 }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // Cover entire screen
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  loaderContainer: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});
