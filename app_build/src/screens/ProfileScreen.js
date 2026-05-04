import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';
import DYNAMIC_CATEGORIES from '../data/categories.json';

const CATEGORIES = DYNAMIC_CATEGORIES.map((cat) => ({
  id: cat.name,
  label: cat.name,
  icon: 'newspaper-outline'
}));

const CATEGORY_LABELS = DYNAMIC_CATEGORIES.reduce((acc, cat) => {
  acc[cat.name] = cat.name;
  return acc;
}, {});

export default function ProfileScreen({ navigation }) {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const { categoryScores, interactions, selectedCategories, updateCategories, isDarkMode, toggleDarkMode, isLoggedIn, logout, completeLogin, readHistory } = useUserStore();

  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync draft if external changes happen
  React.useEffect(() => {
    setDraftCategories(selectedCategories);
  }, [selectedCategories]);

  const toggleDraft = useCallback((id) => {
    setDraftCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }, []);

  const savePreferences = useCallback(() => {
    updateCategories(draftCategories);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  }, [draftCategories, updateCategories]);

  const isDraftChanged = draftCategories.length > 0 && 
    (draftCategories.length !== selectedCategories.length || !draftCategories.every(c => selectedCategories.includes(c)));

  const sortedCategories = useMemo(() =>
    Object.entries(categoryScores).sort(([, a], [, b]) => b - a),
    [categoryScores]
  );

  const totalInteractions = useMemo(() => ({
    reads: readHistory?.length || 0,
    bookmarks: interactions.bookmarks?.size || 0,
    hidden: interactions.notInterested?.size || 0,
  }), [interactions, readHistory]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: tokenColors.primary }]}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.username, { color: colors.text.primary }]}>
            {isLoggedIn ? 'Pengguna Terdaftar' : 'Pengguna Tamu'}
          </Text>
          <Text style={[styles.tagline, { color: colors.text.tertiary }]}>
            {isLoggedIn ? 'Personalisasi berita kamu di sini' : 'Masuk untuk menyimpan artikel'}
          </Text>
          {!isLoggedIn ? (
            <TouchableOpacity 
              style={[styles.authButton, { backgroundColor: tokenColors.primary }]}
              onPress={completeLogin}
            >
              <Text style={styles.authButtonText}>Masuk</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.authButton, { backgroundColor: colors.border }]}
              onPress={logout}
            >
              <Text style={[styles.authButtonText, { color: colors.text.secondary }]}>Keluar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, marginTop: spacing[3], ...shadows.sm }]}>
          {[
            { label: 'Dibaca', value: totalInteractions.reads, icon: 'eye-outline', route: 'ReadHistory' },
            { label: 'Tersimpan', value: totalInteractions.bookmarks, icon: 'bookmark-outline', route: 'Saved' },
            { label: 'Disembunyikan', value: totalInteractions.hidden, icon: 'eye-off-outline', route: 'Hidden' },
          ].map((stat, i) => (
            <TouchableOpacity
              key={stat.label}
              style={styles.statItem}
              onPress={() => navigation?.navigate(stat.route)}
              activeOpacity={0.7}
            >
              <Ionicons name={stat.icon} size={20} color={tokenColors.primary} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{stat.label}</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.text.tertiary} style={{ marginTop: 2 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Edit Preferences */}
        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: spacing[3] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Kelola Preferensi</Text>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            Pilih kategori berita yang ingin kamu tampilkan di beranda.
          </Text>
          
          <View style={styles.chipsContainer}>
            {CATEGORIES.map((cat) => {
              const isSelected = draftCategories.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleDraft(cat.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: isSelected ? tokenColors.primary : colors.chip.background },
                    isSelected && { borderColor: tokenColors.primaryLight, borderWidth: 1 }
                  ]}
                >
                  <Ionicons name={cat.icon} size={14} color={isSelected ? '#FFF' : colors.text.secondary} />
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text.secondary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {isDraftChanged && (
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: tokenColors.primary, borderRadius: br.md }]}
              onPress={savePreferences}
            >
              <Text style={styles.saveBtnText}>Simpan Preferensi</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Scores */}
        {sortedCategories.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, marginTop: spacing[3] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Minat Kategori</Text>
            {sortedCategories.map(([cat, score]) => (
              <View key={cat} style={styles.scoreRow}>
                <Text style={[styles.scoreCat, { color: colors.text.secondary }]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
                <View style={[styles.scoreBarTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      { width: `${score}%`, backgroundColor: score > 60 ? tokenColors.primary : colors.text.tertiary },
                    ]}
                  />
                </View>
                <Text style={[styles.scoreValue, { color: colors.text.tertiary }]}>{Math.round(score)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: spacing[3] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Pengaturan</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.text.secondary} />
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Mode Gelap</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: tokenColors.primaryLight }}
              thumbColor={isDarkMode ? tokenColors.primary : '#F4F3F4'}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.surface, borderRadius: br.xl, ...shadows.lg }]}>
            <View style={[styles.successIconWrapper, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text.primary }]}>Berhasil!</Text>
            <Text style={[styles.successSubtitle, { color: colors.text.secondary }]}>
              Preferensi berhasil diperbarui
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
  },
  authButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreCat: {
    fontSize: 13,
    fontWeight: '500',
    width: 90,
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
