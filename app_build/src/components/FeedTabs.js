import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';

// ─── Feed Tabs ─────────────────────────────────────────────────────────────
// Tabs: Untukmu / Populer / Terbaru
// Follows: bottom-nav-limit, nav-state-active, tab-bar-ios rules

const TABS = [
  { id: 'untukmu', label: 'Untukmu' },
  { id: 'populer', label: 'Populer' },
  { id: 'terbaru', label: 'Terbaru' },
];

export const FeedTabs = memo(({ activeTab, onTabChange }) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.tab.background, borderBottomColor: colors.border }]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? colors.tab.active : colors.tab.inactive,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: colors.tab.active }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 20,
    position: 'relative',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    letterSpacing: -0.1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
});
