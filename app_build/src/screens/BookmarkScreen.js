import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { useNewsStore } from '../store/newsStore';
import { ListCard } from '../components/NewsCard';

export default function BookmarkScreen({ navigation }) {
  const { colors, spacing, shadows } = useTheme();
  const { interactions, requestBookmark, markNotInterested, trackClick, isDarkMode } = useUserStore();
  const { getBookmarked } = useNewsStore();

  const bookmarked = useMemo(() => getBookmarked(interactions.bookmarks), [interactions.bookmarks]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, ...shadows.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tersimpan</Text>
        {bookmarked.length > 0 && (
          <Text style={[styles.headerCount, { color: colors.text.tertiary }]}>{bookmarked.length} artikel</Text>
        )}
      </View>

      <FlatList
        data={bookmarked}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing[4], marginBottom: spacing[3] }}>
            <ListCard
              article={item}
              onPress={() => { trackClick(item); navigation?.navigate('Article', { article: item }); }}
              onBookmark={() => requestBookmark(item.id)}
              onNotInterested={markNotInterested}
            />
          </View>
        )}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Belum ada yang tersimpan</Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Ketuk ikon bookmark pada artikel untuk menyimpannya di sini.
            </Text>
          </View>
        )}
        removeClippedSubviews
        maxToRenderPerBatch={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
