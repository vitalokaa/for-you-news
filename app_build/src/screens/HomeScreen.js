import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { useNewsStore } from '../store/newsStore';
import { HeroCard, ListCard } from '../components/NewsCard';
import { FeedTabs } from '../components/FeedTabs';
import { FeedSkeleton } from '../components/SkeletonLoader';

// ─── Home Feed Screen ───────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors, spacing, shadows } = useTheme();
  const { categoryScores, interactions, selectedCategories, trackClick, requestBookmark, markNotInterested, isDarkMode, toggleDarkMode } = useUserStore();
  const { 
    articles, isLoading, isRefreshing, error, activeTab, setActiveTab, 
    fetchNews, refreshFeed, loadMoreNews, checkNewItems,
    newItemsAvailable, newArticlesCount, isFetchingMore, hasMore,
    getForYou, getPopular, getLatest 
  } = useNewsStore();
  const flatListRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    fetchNews(categoryScores, interactions);
  }, []);

  // Poll for new articles
  useEffect(() => {
    const interval = setInterval(() => {
      checkNewItems();
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [checkNewItems]);

  // Get filtered + ranked articles based on active tab
  const feedArticles = useMemo(() => {
    switch (activeTab) {
      case 'populer': return getPopular(interactions, selectedCategories);
      case 'terbaru': return getLatest(interactions, selectedCategories);
      default: return getForYou(interactions, selectedCategories);
    }
  }, [activeTab, articles, interactions, selectedCategories]);

  const handleArticlePress = useCallback((article) => {
    trackClick(article);
    navigation?.navigate('Article', { article });
  }, [trackClick]);

  const handleBookmark = useCallback((articleId) => {
    requestBookmark(articleId);
  }, [requestBookmark]);

  const handleNotInterested = useCallback((article) => {
    markNotInterested(article);
  }, [markNotInterested]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [setActiveTab]);

  const handleRefresh = useCallback(() => {
    refreshFeed(categoryScores, interactions);
  }, [categoryScores, interactions]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      loadMoreNews(categoryScores, interactions);
    }
  }, [isFetchingMore, hasMore, loadMoreNews, categoryScores, interactions]);

  const handleNewItemsClick = useCallback(() => {
    refreshFeed(categoryScores, interactions);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [refreshFeed, categoryScores, interactions]);

  // ── List render helpers ──────────────────────────────────────────────────
  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item, index }) => {
    if (index === 0 && activeTab === 'untukmu') {
      return (
        <View style={{ paddingHorizontal: spacing[4], marginBottom: spacing[3] }}>
          <HeroCard
            article={item}
            onPress={() => handleArticlePress(item)}
            onBookmark={() => handleBookmark(item.id)}
          />
        </View>
      );
    }
    return (
      <View style={{ paddingHorizontal: spacing[4], marginBottom: spacing[3] }}>
        <ListCard
          article={item}
          onPress={() => handleArticlePress(item)}
          onBookmark={() => handleBookmark(item.id)}
          onNotInterested={handleNotInterested}
        />
      </View>
    );
  }, [activeTab, spacing, handleArticlePress, handleBookmark, handleNotInterested]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={64} color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Belum ada berita</Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        {error ? 'Gagal memuat berita. Coba lagi.' : 'Tarik ke bawah untuk memuat berita terbaru.'}
      </Text>
      {error && (
        <TouchableOpacity
          onPress={() => fetchNews(categoryScores, interactions, true)}
          style={[styles.retryBtn, { backgroundColor: colors.chip.selectedBackground }]}
        >
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Coba Lagi</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [colors, error]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* ── Top App Bar ── */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.border, ...shadows.sm }]}>
        <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <View style={styles.appBarActions}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.iconBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang berita"
          >
            <Ionicons name="refresh-outline" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleDarkMode}
            style={styles.iconBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isDarkMode ? 'Mode terang' : 'Mode gelap'}
          >
            <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Cari berita"
          >
            <Ionicons name="search-outline" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feed ── */}
      {newItemsAvailable && newArticlesCount > 0 && (
        <TouchableOpacity 
          style={[styles.newItemsBanner, { backgroundColor: colors.primary }]}
          onPress={handleNewItemsClick}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-up" size={16} color="#FFF" />
          <Text style={styles.newItemsText}>{newArticlesCount} Berita Baru Tersedia</Text>
        </TouchableOpacity>
      )}

      {isLoading && !isRefreshing ? (
        <FeedSkeleton />
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedArticles}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={[styles.listContent, { paddingTop: spacing[3] }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tab.active}
              colors={[colors.tab.active]}
            />
          }
          // Pagination
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !hasMore && feedArticles.length > 0 ? (
              <View style={styles.footerEnd}>
                <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>Kamu sudah melihat semua berita.</Text>
              </View>
            ) : null
          }
          // Performance: virtualization
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={5}
          updateCellsBatchingPeriod={30}
          getItemLayout={undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingRight: 12,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
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
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newItemsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  newItemsText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerEnd: {
    paddingVertical: 32,
    alignItems: 'center',
  }
});
