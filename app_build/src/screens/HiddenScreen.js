import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { useNewsStore } from '../store/newsStore';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function HiddenScreen({ navigation }) {
  const { colors, spacing, shadows } = useTheme();
  const { interactions, clearHidden, isDarkMode } = useUserStore();
  const { articles } = useNewsStore();

  // Resolve hidden article objects from the full store
  const hiddenArticles = useMemo(() => {
    const hiddenIds = interactions.notInterested;
    return articles.filter((a) => hiddenIds.has(a.id));
  }, [interactions.notInterested, articles]);

  const onUnhide = useCallback((articleId) => {
    // Remove from notInterested set
    useUserStore.setState((state) => {
      const notInterested = new Set(state.interactions.notInterested);
      notInterested.delete(articleId);
      return { interactions: { ...state.interactions, notInterested } };
    });
  }, []);

  const onClearAll = useCallback(() => {
    Alert.alert(
      'Tampilkan Kembali Semua',
      'Semua artikel yang disembunyikan akan muncul di feed lagi. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Tampilkan', onPress: clearHidden },
      ]
    );
  }, [clearHidden]);

  const renderItem = useCallback(({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm }]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={[styles.cardImage, styles.dimmed]} contentFit="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.border }]}>
          <Ionicons name="eye-off-outline" size={24} color={colors.text.tertiary} />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={[styles.hiddenBadge, { backgroundColor: colors.text.tertiary + '22' }]}>
          <Ionicons name="eye-off-outline" size={10} color={colors.text.tertiary} />
          <Text style={[styles.hiddenBadgeText, { color: colors.text.tertiary }]}>Disembunyikan</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text.secondary }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.cardSource, { color: colors.text.tertiary }]}>{item.source} · {formatDate(item.publishedAt)}</Text>
      </View>
      {/* Unhide button */}
      <TouchableOpacity
        onPress={() => onUnhide(item.id)}
        style={[styles.unhideBtn, { backgroundColor: colors.primary + '18' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="eye-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  ), [colors, shadows, onUnhide]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, ...shadows.sm }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="eye-off-outline" size={20} color={colors.text.secondary} />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Disembunyikan</Text>
        </View>
        {hiddenArticles.length > 0 && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.primary }]}>Tampilkan Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={hiddenArticles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3], paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => hiddenArticles.length > 0 ? (
          <Text style={[styles.countLabel, { color: colors.text.tertiary }]}>
            {hiddenArticles.length} artikel disembunyikan dari feed Anda
          </Text>
        ) : null}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="eye-outline" size={72} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Tidak ada yang disembunyikan</Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Ketuk "Tidak Tertarik" pada artikel untuk menyembunyikannya dari feed Anda.
            </Text>
          </View>
        )}
        removeClippedSubviews
        maxToRenderPerBatch={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 10,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 13, fontWeight: '600' },
  countLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 12, gap: 12, borderWidth: 1,
  },
  cardImage: { width: 72, height: 72, borderRadius: 10 },
  dimmed: { opacity: 0.45 },
  cardImagePlaceholder: {
    width: 72, height: 72, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 4 },
  hiddenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  hiddenBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cardSource: { fontSize: 11, fontWeight: '500' },
  unhideBtn: { padding: 8, borderRadius: 8 },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
