import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ImageBackground, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';
import DYNAMIC_CATEGORIES from '../data/categories.json';

// Map dynamic dataset categories to UI format with fallback images
const CATEGORIES = DYNAMIC_CATEGORIES.map((cat, index) => ({
  id: cat.name,
  label: cat.name,
  imageUrl: `https://picsum.photos/400/300?random=${index + 1}`
}));

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 16 * 2 - 12) / 2;

// Removed local CATEGORIES in favor of the imported one
// ─── Category Card ─────────────────────────────────────────────────────────
const CategoryCard = memo(({ item, isSelected, onPress }) => {
  const { borderRadius: br, shadows } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      activeOpacity={0.88}
      style={[
        styles.categoryCard,
        { width: CARD_W, height: CARD_W * 0.72, borderRadius: br.lg, ...shadows.md },
        isSelected && styles.categoryCardSelected,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`Kategori: ${item.label}`}
    >
      <ImageBackground
        source={{ uri: item.imageUrl }}
        style={StyleSheet.absoluteFill}
        imageStyle={{ borderRadius: br.lg }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={[StyleSheet.absoluteFill, { borderRadius: br.lg }]}
          locations={[0.3, 1]}
        />
        {/* Selected overlay */}
        {isSelected && (
          <View style={[StyleSheet.absoluteFill, styles.selectedOverlay, { borderRadius: br.lg }]} />
        )}
        <View style={styles.categoryContent}>
          <Text style={styles.categoryLabel}>{item.label}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
});

// ─── Onboarding Screen ─────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const { selectedCategories, toggleCategory, setOnboardingComplete } = useUserStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSelect = useCallback((id) => {
    toggleCategory(id);
  }, [toggleCategory]);

  const canProceed = selectedCategories.length > 0;

  const handleComplete = useCallback(() => {
    if (!canProceed) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setOnboardingComplete(selectedCategories);
    }, 2000);
  }, [canProceed, selectedCategories, setOnboardingComplete]);

  const renderItem = useCallback(({ item }) => (
    <CategoryCard
      item={item}
      isSelected={selectedCategories.includes(item.id)}
      onPress={handleSelect}
    />
  ), [selectedCategories, handleSelect]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: spacing[6] }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Pilih kategori favoritmu ! 🎯
            </Text>
            <Text style={[styles.subtitle, { color: tokenColors.primary }]}>
              Pilih sebanyak yang kamu mau
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
            <TouchableOpacity
              onPress={handleComplete}
              activeOpacity={canProceed ? 0.85 : 1}
              style={[
                styles.ctaButton,
                {
                  backgroundColor: canProceed ? tokenColors.primary : colors.border,
                  borderRadius: br.lg,
                  ...shadows.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pilih ${selectedCategories.length} kategori dan lanjutkan`}
              accessibilityState={{ disabled: !canProceed }}
            >
              <Text style={[styles.ctaText, { color: canProceed ? '#FFFFFF' : colors.text.tertiary }]}>
                Pilih{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        }
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />

      {/* Success Modal */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.surface, borderRadius: br.xl, ...shadows.lg }]}>
            <View style={[styles.successIconWrapper, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text.primary }]}>Berhasil!</Text>
            <Text style={[styles.successSubtitle, { color: colors.text.secondary }]}>
              Kami akan menampilkan berita sesuai preferensimu
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  selectedOverlay: {
    backgroundColor: 'rgba(26,58,110,0.45)',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  categoryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  ctaButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    padding: 32,
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  }
});
