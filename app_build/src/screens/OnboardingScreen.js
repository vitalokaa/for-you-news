import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ImageBackground, SafeAreaView, StatusBar, Dimensions,
  Platform, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';
import DYNAMIC_CATEGORIES from '../data/categories.json';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const GRID_PADDING = 20;
const GAP = 12;

// Map dynamic dataset categories to UI format with fallback images
const CATEGORIES = DYNAMIC_CATEGORIES.map((cat, index) => ({
  id: cat.name,
  label: cat.name,
  imageUrl: `https://picsum.photos/400/300?random=${index + 1}`
}));

// ─── Category Card (Bento Style) ─────────────────────────────────────────────
const CategoryCard = memo(({ item, index, isSelected, onPress }) => {
  const { borderRadius: br, shadows, animation } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  // Modern Editorial Bento Sizes
  const isLarge = index % 5 === 0 || index % 5 === 3;
  const cardWidth = isLarge ? SCREEN_W - GRID_PADDING * 2 : (SCREEN_W - GRID_PADDING * 2 - GAP) / 2;
  const cardHeight = isLarge ? 160 : 120;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => onPress(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.categoryCard,
          { 
            width: cardWidth, 
            height: cardHeight, 
            borderRadius: br.xl,
            ...shadows.md 
          },
          isSelected && { borderColor: tokenColors.primary, borderWeight: 2 }
        ]}
      >
        <ImageBackground
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          imageStyle={{ borderRadius: br.xl }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)']}
            style={[StyleSheet.absoluteFill, { borderRadius: br.xl }]}
            locations={[0, 0.9]}
          />
          
          <View style={styles.categoryContent}>
            <Text style={[styles.categoryLabel, { fontSize: isLarge ? 20 : 15 }]}>
              {item.label}
            </Text>
          </View>

          {isSelected && (
            <View style={[styles.selectionOverlay, { borderRadius: br.xl }]}>
              <LinearGradient
                colors={['rgba(26,58,110,0.4)', 'rgba(26,58,110,0.8)']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
            </View>
          )}
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Onboarding Screen ─────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const { selectedCategories, toggleCategory, setOnboardingComplete } = useUserStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const canProceed = selectedCategories.length >= 3;

  const handleComplete = useCallback(() => {
    if (!canProceed) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setOnboardingComplete(selectedCategories);
    }, 1500);
  }, [canProceed, selectedCategories, setOnboardingComplete]);

  const renderItem = useCallback(({ item, index }) => (
    <CategoryCard
      item={item}
      index={index}
      isSelected={selectedCategories.includes(item.id)}
      onPress={toggleCategory}
    />
  ), [selectedCategories, toggleCategory]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          numColumns={1} // We handle the layout manually for the bento effect
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={[styles.brandLabel, { color: tokenColors.primary }]}>NEWS FOR YOU</Text>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Apa yang ingin Anda baca hari ini?
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Pilih minimal <Text style={{ fontWeight: '700', color: tokenColors.primary }}>3 kategori</Text> untuk mempersonalisasi beranda Anda.
              </Text>
            </View>
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />

        {/* Fixed Floating CTA */}
        <LinearGradient
          colors={['rgba(247,248,FA,0)', 'rgba(247,248,FA,0.9)', '#F7F8FA']}
          style={styles.footerGradient}
          locations={[0, 0.3, 0.6]}
        >
          <TouchableOpacity
            onPress={handleComplete}
            disabled={!canProceed}
            activeOpacity={0.8}
            style={[
              styles.ctaButton,
              {
                backgroundColor: canProceed ? tokenColors.primary : '#CBD5E0',
                borderRadius: br.full,
                ...shadows.lg,
              },
            ]}
          >
            <Text style={styles.ctaText}>
              {canProceed 
                ? `Lanjutkan (${selectedCategories.length})` 
                : `Pilih ${3 - selectedCategories.length} lagi`}
            </Text>
            {canProceed && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { backgroundColor: 'rgba(26,58,110,0.95)' }]}>
          <Ionicons name="sparkles" size={80} color="#FFFFFF" />
          <Text style={styles.successText}>Menyiapkan Feed Anda...</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  brandLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Newsreader' : 'serif',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  categoryCard: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  categoryLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ctaButton: {
    height: 56,
    width: IS_WEB ? 300 : '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  }
});

