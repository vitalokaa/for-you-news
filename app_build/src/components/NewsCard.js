import React, { useState, useCallback, memo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Utilities ─────────────────────────────────────────────────────────────
function formatTimeAgo(dateString) {
  const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function getCategoryColor(category) {
  return tokenColors.categories[category] || '#6366F1';
}

// ─── Category Badge ─────────────────────────────────────────────────────────
const CategoryBadge = memo(({ category, small = false }) => {
  const bg = getCategoryColor(category);
  return (
    <View style={[styles.badge, { backgroundColor: bg }, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, small && styles.badgeTextSmall]}>{category}</Text>
    </View>
  );
});

// ─── Hero Card ──────────────────────────────────────────────────────────────
// Full-width featured article with gradient overlay
export const HeroCard = memo(({ article, onPress, onBookmark }) => {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const isBookmarked = useUserStore((s) => s.isBookmarked(article.id));

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.heroCard, { borderRadius: br.xl, ...shadows.lg }, { backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`Buka artikel: ${article.title}`}
    >
      <Image
        source={{ uri: article.imageUrl }}
        style={[styles.heroImage, { borderRadius: br.xl }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.88)']}
        style={[StyleSheet.absoluteFill, { borderRadius: br.xl }]}
        locations={[0.2, 0.55, 1]}
      />
      <View style={[styles.heroContent, { padding: spacing[4] }]}>
        <CategoryBadge category={article.category} />
        <Text style={[styles.heroTitle, { marginTop: spacing[2] }]} numberOfLines={3}>
          {article.title}
        </Text>
        <View style={[styles.heroMeta, { marginTop: spacing[2] }]}>
          <Text style={styles.heroMetaText}>{article.source}</Text>
          <Text style={styles.heroMetaDot}>·</Text>
          <Text style={styles.heroMetaText}>{formatTimeAgo(article.publishedAt)}</Text>
          <Text style={styles.heroMetaDot}>·</Text>
          <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={[styles.heroMetaText, { marginLeft: 2 }]}>{formatViews(article.views)}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onBookmark}
        style={styles.bookmarkBtn}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        accessibilityRole="button"
        accessibilityLabel={isBookmarked ? 'Hapus bookmark' : 'Simpan artikel'}
      >
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={22}
          color={isBookmarked ? '#F59E0B' : '#FFFFFF'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ─── List Card ──────────────────────────────────────────────────────────────
// Compact horizontal card for feed list
export const ListCard = memo(({ article, onPress, onBookmark, onNotInterested, style }) => {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const isBookmarked = useUserStore((s) => s.isBookmarked(article.id));

  // Swipe-to-dismiss for "Tidak Tertarik"
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [revealed, setRevealed] = useState(false);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) translateX.setValue(g.dx);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -80) {
        setRevealed(true);
        Animated.timing(translateX, { toValue: -120, duration: 200, useNativeDriver: true }).start();
      } else {
        setRevealed(false);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const handleNotInterested = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -SCREEN_W, duration: 300, useNativeDriver: true }),
    ]).start(() => onNotInterested?.(article));
  };

  return (
    <View style={[styles.listCardWrapper, style]}>
      {/* Swipe reveal: "Tidak Tertarik" button */}
      <TouchableOpacity
        style={[styles.notInterestedReveal, { borderRadius: br.lg, backgroundColor: tokenColors.accent }]}
        onPress={handleNotInterested}
        accessibilityRole="button"
        accessibilityLabel="Tandai tidak tertarik"
      >
        <Ionicons name="eye-off-outline" size={20} color="#FFFFFF" />
        <Text style={styles.notInterestedText}>Tidak{'\n'}Tertarik</Text>
      </TouchableOpacity>

      <Animated.View
        style={{ transform: [{ translateX }], opacity }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={[
            styles.listCard,
            {
              backgroundColor: colors.surface,
              borderRadius: br.lg,
              ...shadows.sm,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Buka artikel: ${article.title}`}
        >
          <Image
            source={{ uri: article.imageUrl }}
            style={[styles.listThumb, { borderRadius: br.md }]}
            resizeMode="cover"
          />
          <View style={styles.listContent}>
            <CategoryBadge category={article.category} small />
            <Text
              style={[styles.listTitle, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {article.title}
            </Text>
            <View style={styles.listMeta}>
              <Text style={[styles.listMetaText, { color: colors.text.tertiary }]}>
                {article.source} · {formatTimeAgo(article.publishedAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onBookmark}
            style={styles.listBookmark}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Hapus bookmark' : 'Simpan artikel'}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#F59E0B' : colors.text.tertiary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hero
  heroCard: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  heroMetaDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Badge
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTextSmall: {
    fontSize: 10,
  },

  // List Card
  listCardWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  notInterestedReveal: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 112,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  notInterestedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  listCard: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  listThumb: {
    width: 96,
    height: 80,
    flexShrink: 0,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listMetaText: {
    fontSize: 11,
    fontWeight: '400',
  },
  listBookmark: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
