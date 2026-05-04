import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

// ─── Skeleton Loader ───────────────────────────────────────────────────────
// Shimmer animation: slides a highlight across the skeleton shape
// Follows UI/UX-Pro-Max: progressive-loading, animate-pulse

export function SkeletonBox({ width, height, style, borderRadius = 8 }) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

// Hero card skeleton
export function HeroCardSkeleton() {
  const { colors, spacing, borderRadius: br } = useTheme();
  return (
    <View style={[styles.heroSkeleton, { backgroundColor: colors.surface, borderRadius: br.xl, marginHorizontal: spacing[4], marginTop: spacing[3] }]}>
      <SkeletonBox width="100%" height={200} borderRadius={br.xl} />
      <View style={{ padding: spacing[4], gap: spacing[2] }}>
        <SkeletonBox width={80} height={20} borderRadius={br.full} />
        <SkeletonBox width="90%" height={24} borderRadius={br.md} />
        <SkeletonBox width="70%" height={24} borderRadius={br.md} />
        <SkeletonBox width={120} height={14} borderRadius={br.md} style={{ marginTop: spacing[1] }} />
      </View>
    </View>
  );
}

// List card skeleton
export function ListCardSkeleton() {
  const { colors, spacing, borderRadius: br } = useTheme();
  return (
    <View style={[styles.listCardSkeleton, { backgroundColor: colors.surface, borderRadius: br.lg, marginHorizontal: spacing[4], marginBottom: spacing[3] }]}>
      <SkeletonBox width={96} height={80} borderRadius={br.lg} />
      <View style={{ flex: 1, gap: spacing[1.5], paddingVertical: spacing[1] }}>
        <SkeletonBox width={60} height={14} borderRadius={br.full} />
        <SkeletonBox width="95%" height={16} borderRadius={br.md} />
        <SkeletonBox width="75%" height={16} borderRadius={br.md} />
        <SkeletonBox width={90} height={12} borderRadius={br.md} />
      </View>
    </View>
  );
}

// Loading feed (multiple skeletons)
export function FeedSkeleton() {
  return (
    <View>
      <HeroCardSkeleton />
      {[1, 2, 3, 4].map((i) => (
        <ListCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroSkeleton: {
    overflow: 'hidden',
  },
  listCardSkeleton: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    overflow: 'hidden',
  },
});
