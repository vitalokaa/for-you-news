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

export default function SavedScreen({ navigation }) {
  const { colors, spacing, shadows } = useTheme();
  const { interactions, requestBookmark, markNotInterested, trackClick, isDarkMode } = useUserStore();
  const { getBookmarked } = useNewsStore();

  const bookmarked = useMemo(() => getBookmarked(interactions.bookmarks), [interactions.bookmarks]);

  const onRemoveAll = useCallback(() => {
    Alert.alert(
      'Hapus Semua Tersimpan',
      'Semua artikel tersimpan akan dihapus. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: () => bookmarked.forEach((a) => requestBookmark(a.id)),
        },
      ]
    );
  }, [bookmarked, requestBookmark]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm }]}
      onPress={() => { trackClick(item); navigation?.navigate('Article', { article: item }); }}
      activeOpacity={0.82}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.border }]}>
          <Ionicons name="newspaper-outline" size={24} color={colors.text.tertiary} />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardMetaText, { color: colors.text.tertiary }]}>{item.source}</Text>
          <Text style={[styles.cardDot, { color: colors.text.tertiary }]}>·</Text>
          <Text style={[styles.cardMetaText, { color: colors.text.tertiary }]}>{formatDate(item.publishedAt)}</Text>
        </View>
      </View>
      {/* Unsave button */}
      <TouchableOpacity
        onPress={() => requestBookmark(item.id)}
        style={[styles.unsaveBtn, { backgroundColor: colors.primary + '18' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="bookmark" size={18} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [colors, shadows, navigation, trackClick, requestBookmark]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, ...shadows.sm }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tersimpan</Text>
        </View>
        {bookmarked.length > 0 && (
          <TouchableOpacity onPress={onRemoveAll} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.error || '#ef4444' }]}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={bookmarked}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3], paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => bookmarked.length > 0 ? (
          <Text style={[styles.countLabel, { color: colors.text.tertiary }]}>
            {bookmarked.length} artikel tersimpan
          </Text>
        ) : null}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={72} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Belum ada yang tersimpan</Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Ketuk ikon bookmark pada artikel untuk menyimpannya di sini.
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
  cardImagePlaceholder: {
    width: 72, height: 72, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 4 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, fontWeight: '500' },
  cardDot: { fontSize: 11 },
  unsaveBtn: { padding: 8, borderRadius: 8 },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
