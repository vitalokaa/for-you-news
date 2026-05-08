import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, SafeAreaView, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';

export default function ArticleScreen({ route, navigation }) {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const { requestBookmark, isBookmarked, markAsRead } = useUserStore();
  
  // Article passed via navigation parameters
  const { article } = route.params || {};

  // Mark article as read immediately when screen opens (persisted to AsyncStorage)
  useEffect(() => {
    if (article) markAsRead(article);
  }, []);

  const handleBookmark = useCallback(() => {
    if (article) requestBookmark(article.id);
  }, [article, requestBookmark]);

  const handleOpenOriginal = useCallback(async () => {
    if (!article?.url) return;
    try {
      // 1. Strict validation to ensure it's not a root domain
      const urlObj = new URL(article.url);
      if (urlObj.pathname === '/' || urlObj.pathname.length <= 1) {
        Alert.alert('Gagal', 'Artikel tidak tersedia dari sumber asli.');
        return;
      }

      // 2. Open via External Browser
      // (HEAD request removed because strict CORS policies on Web block valid links like BBC/Reuters)
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Gagal', 'Perangkat tidak mendukung pembukaan tautan ini.');
      }
    } catch (error) {
      Alert.alert('Gagal', 'URL artikel tidak valid atau rusak.');
    }
  }, [article]);

  if (!article) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text.primary }}>Artikel tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: tokenColors.primary, fontWeight: 'bold' }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bookmarked = isBookmarked(article.id);
  
  // Format Date (assuming ISO string or fallback)
  const dateObj = new Date(article.publishedAt);
  const formattedDate = !isNaN(dateObj) 
    ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Beberapa saat yang lalu';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header Image with Gradient overlay */}
        <ImageBackground
          source={{ uri: article.imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', colors.background]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.headerNav}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Kembali"
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 8 }]}
                accessibilityLabel="Bagikan"
              >
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={handleBookmark}
                accessibilityLabel={bookmarked ? "Hapus Bookmark" : "Bookmark"}
              >
                <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={bookmarked ? tokenColors.primaryLight : "#FFF"} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Content Wrapper */}
        <View style={styles.contentWrapper}>
          
          {/* Metadata */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.chip.background }]}>
              <Text style={[styles.categoryText, { color: colors.text.secondary }]}>{article.category || 'Berita'}</Text>
            </View>
            <View style={styles.sourceWrapper}>
              <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
              <Text style={[styles.dateText, { color: colors.text.tertiary }]}>{formattedDate}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>{article.title}</Text>

          {/* Source Author Block */}
          <View style={[styles.authorBlock, { borderBottomColor: colors.border, borderTopColor: colors.border }]}>
            <View style={[styles.sourceIcon, { backgroundColor: tokenColors.primary }]}>
              <Text style={styles.sourceInitials}>{article.source?.[0] || 'N'}</Text>
            </View>
            <View>
              <Text style={[styles.sourceName, { color: colors.text.primary }]}>{article.source}</Text>
              <Text style={[styles.authorName, { color: colors.text.tertiary }]}>
                {article.author ? `Oleh ${article.author}` : 'Redaksi'}
              </Text>
            </View>
          </View>


          {/* Full Content Paragraphs */}
          <View style={styles.articleBody}>
            {(article.content || article.description || '').split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
              <Text key={index} style={[styles.bodyText, { color: colors.text.secondary }]}>
                {paragraph.trim()}
              </Text>
            ))}
          </View>

          {/* Original News Link */}
          {article.url ? (
            <TouchableOpacity 
              style={[styles.externalLinkBtn, { backgroundColor: tokenColors.primary }]}
              onPress={handleOpenOriginal}
            >
              <Text style={styles.externalLinkText}>Go to Original News</Text>
              <Ionicons name="open-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : null}

        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroImage: {
    width: '100%',
    height: 380, // Generous height for hero image
    justifyContent: 'flex-start',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)', // Web support for blur
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sourceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  authorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceInitials: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
  },
  articleBody: {
    paddingBottom: 8,
  },
  bodyText: {
    fontSize: 17,
    lineHeight: 28, // ~1.65 line height for optimal readability
    letterSpacing: 0.2,
    marginBottom: 24, // Clean paragraph spacing
    maxWidth: '100%',
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 20,
    gap: 8,
  },
  externalLinkText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
