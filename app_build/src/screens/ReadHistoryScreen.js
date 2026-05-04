import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../theme';
import { useUserStore } from '../store/userStore';

// Format relative time
const formatRelativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  return `${mins} menit lalu`;
};

export default function ReadHistoryScreen({ navigation }) {
  const { colors, spacing, shadows } = useTheme();
  const { readHistory, clearReadHistory, isDarkMode } = useUserStore();

  const onClear = useCallback(() => {
    Alert.alert(
      'Hapus Riwayat',
      'Semua riwayat artikel yang dibaca akan dihapus. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: clearReadHistory },
      ]
    );
  }, [clearReadHistory]);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm }]}
      onPress={() => navigation?.navigate('Article', { article: item })}
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
          <Ionicons name="time-outline" size={11} color={colors.text.tertiary} />
          <Text style={[styles.cardMetaText, { color: colors.text.tertiary }]}>
            Dibaca {formatRelativeTime(item.readAt)}
          </Text>
          <Text style={[styles.cardDot, { color: colors.text.tertiary }]}>·</Text>
          <Text style={[styles.cardMetaText, { color: colors.text.tertiary }]}>{item.source}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </TouchableOpacity>
  ), [colors, shadows, navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, ...shadows.sm }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Riwayat Dibaca</Text>
        </View>
        {readHistory.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.error || '#ef4444' }]}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={readHistory}
        keyExtractor={(item) => item.id + item.readAt}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3], paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => readHistory.length > 0 ? (
          <Text style={[styles.countLabel, { color: colors.text.tertiary }]}>
            {readHistory.length} artikel telah dibaca
          </Text>
        ) : null}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={72} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Belum ada riwayat</Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Artikel yang Anda baca akan muncul di sini secara otomatis.
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
  clearText: { fontSize: 14, fontWeight: '600' },
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
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  cardMetaText: { fontSize: 11, fontWeight: '500' },
  cardDot: { fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
