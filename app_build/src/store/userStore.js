import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Persistence Keys ──────────────────────────────────────────────────────
const STORAGE_KEYS = {
  ONBOARDING: '@nfy_onboarding',
  CATEGORIES: '@nfy_categories',
  CATEGORY_SCORES: '@nfy_category_scores',
  BOOKMARKS: '@nfy_bookmarks',
  NOT_INTERESTED: '@nfy_not_interested',
  NOT_INTERESTED_TOPICS: '@nfy_not_interested_topics',
  READ_HISTORY: '@nfy_read_history',       // tracks fully-read article IDs
  DARK_MODE: '@nfy_dark_mode',
  IS_LOGGED_IN: '@nfy_is_logged_in',
};

// ─── Helper: serialize/deserialize Sets ───────────────────────────────────
const setToArray = (s) => Array.from(s instanceof Set ? s : []);
const arrayToSet = (a) => new Set(Array.isArray(a) ? a : []);

// ─── Persistence Helpers ───────────────────────────────────────────────────
const persist = async (key, value) => {
  try {
    const serialized = value instanceof Set ? JSON.stringify(setToArray(value)) : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (e) {
    console.warn('[UserStore] Failed to persist:', key, e);
  }
};

const restore = async (key, fallback = null) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

// ─── User Preference Store ─────────────────────────────────────────────────
export const useUserStore = create((set, get) => ({
  // Onboarding
  hasCompletedOnboarding: false,
  selectedCategories: [],

  // Behavior tracking
  interactions: {
    clicks: {},       // articleId -> count
    readTime: {},     // articleId -> seconds
    scrollDepth: {},  // articleId -> 0-100
    bookmarks: new Set(),
    notInterested: new Set(), // articleIds to hide
    notInterestedTopics: {},  // category -> penaltyScore
  },

  // Read history: array of { id, title, source, category, url, publishedAt, readAt }
  readHistory: [],

  // Authentication
  isLoggedIn: false,
  showLoginPrompt: false,
  pendingBookmark: null,

  // Category preference scores (0-100)
  categoryScores: {},

  // Dark mode
  isDarkMode: false,

  // ── Hydration (load all persisted state on app start) ────────────────────
  hydrate: async () => {
    const [
      onboarding, categories, categoryScores,
      bookmarks, notInterested, notInterestedTopics,
      readHistory, darkMode, isLoggedIn
    ] = await Promise.all([
      restore(STORAGE_KEYS.ONBOARDING, false),
      restore(STORAGE_KEYS.CATEGORIES, []),
      restore(STORAGE_KEYS.CATEGORY_SCORES, {}),
      restore(STORAGE_KEYS.BOOKMARKS, []),
      restore(STORAGE_KEYS.NOT_INTERESTED, []),
      restore(STORAGE_KEYS.NOT_INTERESTED_TOPICS, {}),
      restore(STORAGE_KEYS.READ_HISTORY, []),
      restore(STORAGE_KEYS.DARK_MODE, false),
      restore(STORAGE_KEYS.IS_LOGGED_IN, false),
    ]);

    set((state) => ({
      hasCompletedOnboarding: onboarding,
      selectedCategories: categories,
      categoryScores: categoryScores,
      readHistory: readHistory,
      isDarkMode: darkMode,
      isLoggedIn: isLoggedIn,
      interactions: {
        ...state.interactions,
        bookmarks: arrayToSet(bookmarks),
        notInterested: arrayToSet(notInterested),
        notInterestedTopics: notInterestedTopics,
      },
    }));
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  setOnboardingComplete: (categories) => {
    const scores = categories.reduce((acc, cat) => ({ ...acc, [cat]: 70 }), {});
    set({ hasCompletedOnboarding: true, selectedCategories: categories, categoryScores: scores });
    persist(STORAGE_KEYS.ONBOARDING, true);
    persist(STORAGE_KEYS.CATEGORIES, categories);
    persist(STORAGE_KEYS.CATEGORY_SCORES, scores);
  },

  toggleCategory: (category) =>
    set((state) => {
      const selectedCategories = state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category];
      persist(STORAGE_KEYS.CATEGORIES, selectedCategories);
      return { selectedCategories };
    }),

  updateCategories: (newCategories) =>
    set((state) => {
      const newScores = newCategories.reduce((acc, cat) => ({
        ...acc,
        [cat]: state.categoryScores[cat] !== undefined ? state.categoryScores[cat] : 70,
      }), {});
      persist(STORAGE_KEYS.CATEGORIES, newCategories);
      persist(STORAGE_KEYS.CATEGORY_SCORES, newScores);
      return { selectedCategories: newCategories, categoryScores: newScores };
    }),

  // Real-Time Learning Loop (Advanced Personalization)
  trackEvent: (article, eventType, value = null) => {
    set((state) => {
      const newScores = { ...state.categoryScores };
      const cat = article.category;
      let weightChange = 0;

      switch (eventType) {
        case 'like':
        case 'bookmark':   weightChange = 3; break;
        case 'read_full':  weightChange = 2; break;
        case 'view':       weightChange = 1; break;
        case 'skip':       weightChange = -2; break;
        case 'category_click': weightChange = 2; break;
      }

      newScores[cat] = Math.max(0, (newScores[cat] || 0) + weightChange);
      persist(STORAGE_KEYS.CATEGORY_SCORES, newScores);
      return { categoryScores: newScores };
    });
  },

  trackClick: (article) => {
    get().trackEvent(article, 'view');
    set((state) => {
      const clicks = { ...state.interactions.clicks };
      clicks[article.id] = (clicks[article.id] || 0) + 1;
      return { interactions: { ...state.interactions, clicks } };
    });
  },

  // Track an article as "fully read" and persist it
  markAsRead: (article) => {
    set((state) => {
      // Avoid duplicates in history
      if (state.readHistory.some((a) => a.id === article.id)) return {};
      const newHistory = [
        { 
          id: article.id, title: article.title, source: article.source,
          category: article.category, url: article.url,
          imageUrl: article.imageUrl, publishedAt: article.publishedAt,
          readAt: new Date().toISOString()
        },
        ...state.readHistory,
      ].slice(0, 200); // keep last 200 reads
      persist(STORAGE_KEYS.READ_HISTORY, newHistory);
      return { readHistory: newHistory };
    });
    get().trackEvent(article, 'read_full');
  },

  trackReadTime: (articleId, seconds, category) =>
    set((state) => {
      const readTime = { ...state.interactions.readTime };
      readTime[articleId] = (readTime[articleId] || 0) + seconds;
      if (seconds > 30) {
        const catScores = { ...state.categoryScores };
        catScores[category] = Math.max(0, (catScores[category] || 0) + 2);
        persist(STORAGE_KEYS.CATEGORY_SCORES, catScores);
        return { interactions: { ...state.interactions, readTime }, categoryScores: catScores };
      }
      return { interactions: { ...state.interactions, readTime } };
    }),

  trackScrollDepth: (articleId, depth) =>
    set((state) => {
      const scrollDepth = { ...state.interactions.scrollDepth };
      scrollDepth[articleId] = Math.max(scrollDepth[articleId] || 0, depth);
      return { interactions: { ...state.interactions, scrollDepth } };
    }),

  toggleBookmark: (articleId) =>
    set((state) => {
      const bookmarks = new Set(state.interactions.bookmarks);
      if (bookmarks.has(articleId)) bookmarks.delete(articleId);
      else bookmarks.add(articleId);
      persist(STORAGE_KEYS.BOOKMARKS, setToArray(bookmarks));
      return { interactions: { ...state.interactions, bookmarks } };
    }),

  // Auth & Bookmark Flow
  requestBookmark: (articleId) => {
    const state = get();
    if (!state.isLoggedIn) {
      set({ showLoginPrompt: true, pendingBookmark: articleId });
    } else {
      state.toggleBookmark(articleId);
    }
  },

  completeLogin: () => {
    persist(STORAGE_KEYS.IS_LOGGED_IN, true);
    set({ isLoggedIn: true, showLoginPrompt: false });
    const state = get();
    if (state.pendingBookmark) {
      state.toggleBookmark(state.pendingBookmark);
      set({ pendingBookmark: null });
    }
  },

  cancelLogin: () => set({ showLoginPrompt: false, pendingBookmark: null }),

  logout: () => {
    persist(STORAGE_KEYS.IS_LOGGED_IN, false);
    set({ isLoggedIn: false });
  },

  markNotInterested: (article) => {
    get().trackEvent(article, 'skip');
    set((state) => {
      const notInterested = new Set(state.interactions.notInterested);
      notInterested.add(article.id);
      persist(STORAGE_KEYS.NOT_INTERESTED, setToArray(notInterested));
      return { interactions: { ...state.interactions, notInterested } };
    });
  },

  clearReadHistory: () => {
    persist(STORAGE_KEYS.READ_HISTORY, []);
    set({ readHistory: [] });
  },

  clearHidden: () => {
    const empty = new Set();
    persist(STORAGE_KEYS.NOT_INTERESTED, []);
    set((state) => ({ interactions: { ...state.interactions, notInterested: empty } }));
  },

  isBookmarked: (articleId) => get().interactions.bookmarks.has(articleId),
  isHidden: (articleId) => get().interactions.notInterested.has(articleId),
  isRead: (articleId) => get().readHistory.some((a) => a.id === articleId),

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    persist(STORAGE_KEYS.DARK_MODE, next);
    set({ isDarkMode: next });
  },
}));
