import { create } from 'zustand';

// ─── News Store ────────────────────────────────────────────────────────────
// Handles fetching, caching, deduplication, and feed management

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 8000;

import REAL_DATABASE from '../data/articles.json';

// Mock article data that mirrors real API structure for demonstration
// In production: replace with real NewsAPI / GNews calls
const MOCK_ARTICLES = [
  {
    id: 'art-001',
    title: 'Google launches Gemini, its most capable AI model yet',
    summary: 'Google has released its highly anticipated AI model, Gemini, designed to compete directly with OpenAI\'s GPT-4 across multiple benchmarks.',
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    url: 'https://techcrunch.com/2023/12/06/google-launches-gemini-its-most-capable-ai-model-yet/',
    category: 'Teknologi',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    views: 45000,
    isHero: true,
    tags: ['ai', 'google', 'gemini', 'teknologi'],
    embedding: null,
  },
  {
    id: 'art-002',
    title: 'Wall St Week Ahead: Investors brace for US jobs data, Fed meeting',
    summary: 'Investors are preparing for a critical week of economic data, focusing on US jobs numbers and the upcoming Federal Reserve policy meeting.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    url: 'https://www.reuters.com/markets/us/wall-st-week-ahead-investors-brace-us-jobs-data-fed-meeting-2023-12-01/',
    category: 'Bisnis',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    views: 12500,
    isHero: false,
    tags: ['saham', 'ihsg', 'keuangan', 'bisnis'],
    embedding: null,
  },
  {
    id: 'art-003',
    title: 'Man Utd 2-1 Chelsea: Scott McTominay double gives hosts much-needed win',
    summary: 'Scott McTominay scored twice as Manchester United secured a crucial 2-1 victory over Chelsea at Old Trafford.',
    imageUrl: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=400&q=80',
    source: 'BBC Sport',
    sourceUrl: 'https://bbc.com/sport',
    url: 'https://www.bbc.com/sport/football/67637016',
    category: 'Olahraga',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 5,
    views: 89000,
    isHero: false,
    tags: ['sepakbola', 'manchester united', 'chelsea', 'liga inggris'],
    embedding: null,
  },
  {
    id: 'art-004',
    title: 'How climate change is making us sick',
    summary: 'A new comprehensive report highlights the direct link between extreme climate events and the rising global health crisis.',
    imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80',
    source: 'CNN Health',
    sourceUrl: 'https://edition.cnn.com/health',
    url: 'https://edition.cnn.com/2023/11/30/health/cop28-climate-change-health-explainer/index.html',
    category: 'Kesehatan',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    views: 56000,
    isHero: false,
    tags: ['kesehatan', 'pneumonia', 'mycoplasma', 'penyakit'],
    embedding: null,
  },
  {
    id: 'art-005',
    title: 'Taylor Swift named Time magazine\'s person of the year for 2023',
    summary: 'The historic success of the Eras Tour and her immense cultural impact have earned Taylor Swift the title of Time\'s Person of the Year.',
    imageUrl: 'https://images.unsplash.com/photo-1603190287605-e6ade3cb4a00?w=400&q=80',
    source: 'The Guardian',
    sourceUrl: 'https://theguardian.com',
    url: 'https://www.theguardian.com/music/2023/dec/06/taylor-swift-time-magazine-person-of-the-year-2023',
    category: 'Hiburan',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    views: 120000,
    isHero: false,
    tags: ['musik', 'taylor swift', 'penghargaan', 'hiburan'],
    embedding: null,
  },
  {
    id: 'art-006',
    title: 'Where to go in 2024: The best places to visit',
    summary: 'From hidden beaches to cultural hubs, here is the definitive list of the best travel destinations to explore in the upcoming year.',
    imageUrl: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
    source: 'CNN Travel',
    sourceUrl: 'https://edition.cnn.com/travel',
    url: 'https://edition.cnn.com/travel/article/best-places-to-visit-in-2024/index.html',
    category: 'Travel',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 6,
    views: 34000,
    isHero: false,
    tags: ['travel', 'wisata', 'indonesia', 'liburan'],
    embedding: null,
  },
  {
    id: 'art-007',
    title: 'Dinosaur species discovered in Argentina sheds light on evolution',
    summary: 'Paleontologists in Patagonia have unearthed a remarkably preserved skeleton of a previously unknown carnivorous dinosaur species.',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&q=80',
    source: 'Reuters Science',
    sourceUrl: 'https://reuters.com/science',
    url: 'https://www.reuters.com/science/dinosaur-species-discovered-argentina-sheds-light-evolution-2023-12-05/',
    category: 'Sains',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 5,
    views: 18400,
    isHero: false,
    tags: ['sains', 'dinosaurus', 'penelitian', 'fosil'],
    embedding: null,
  },
  {
    id: 'art-008',
    title: 'Why burnout is still a huge problem',
    summary: 'Despite an increased focus on mental health, workplace burnout remains a pervasive issue globally. Experts share strategies for managing it.',
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
    source: 'BBC Worklife',
    sourceUrl: 'https://bbc.com/worklife',
    url: 'https://www.bbc.com/worklife/article/20231128-why-burnout-is-still-a-huge-problem',
    category: 'Gaya Hidup',
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 7,
    views: 22000,
    isHero: false,
    tags: ['kesehatan mental', 'gaya hidup', 'kerja', 'psikologi'],
    embedding: null,
  }
];

// ─── Data Validation ───────────────────────────────────────────────────────
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    // Strict requirements: must be https and cannot be just a domain root (needs a path/slug)
    if (url.protocol !== "https:") return false;
    if (url.pathname.length <= 1) return false;
    return true;
  } catch (e) {
    return false;
  }
};

const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

const validateAndFilterArticles = (articles) => {
  const now = Date.now();
  
  return articles.filter(article => {
    // 1. Must have all required fields
    if (!article.title || !article.source || !article.publishedAt || !article.url) {
      return false;
    }

    // 2. Strict formatting validation & basic link availability check
    if (!isValidUrl(article.url)) {
      return false;
    }

    // 3. Date validation: Must be within the last 5 years
    const pubDate = new Date(article.publishedAt).getTime();
    if (isNaN(pubDate) || (now - pubDate > FIVE_YEARS_MS)) {
      return false;
    }

    return true;
  });
};

// ─── AI Recommendation Engine ──────────────────────────────────────────────
// Hybrid scoring: category preference + recency + popularity + behavioral signals

function computeRelevanceScore(article, categoryScores, interactions) {
  // 1. Recency Score (Requirement: 70% Priority)
  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  // Sharper decay: 100 points initially, loses 5 points per hour. Zeroed after 20 hours.
  const recencyScore = Math.max(0, 100 - ageHours * 5); 

  // 2. Relevance Components (Requirement: 30% Priority)
  // Normalized to 0-100
  let relevanceFactor = 0;

  // A. Category Preference (50% of relevance sub-score)
  const catWeight = Math.min(100, categoryScores[article.category] || 30);
  relevanceFactor += catWeight * 0.50;

  // B. Behavioral signals (30% of relevance sub-score)
  const clickCount = interactions.clicks?.[article.id] || 0;
  const readSeconds = interactions.readTime?.[article.id] || 0;
  const behaviorSub = Math.min(100, (clickCount * 20) + (readSeconds / 2));
  relevanceFactor += behaviorSub * 0.30;

  // C. Source Trust & Popularity (20% of relevance sub-score)
  const trustedSources = ['BBC', 'CNN', 'Reuters', 'The Guardian', 'TechCrunch', 'detik', 'kompas', 'tempo', 'cnnindonesia', 'cnbc', 'antara'];
  const isTrusted = trustedSources.some(s => (article.source || '').toLowerCase().includes(s.toLowerCase())) ? 100 : 50;
  const popScore = Math.min(100, ((article.views || 0) / 500));
  relevanceFactor += ((isTrusted * 0.6) + (popScore * 0.4)) * 0.20;

  // Final Hybrid Score: 70% Recency + 30% Relevance
  const finalScore = (0.7 * recencyScore) + (0.3 * relevanceFactor);

  return Math.max(0, Math.min(100, finalScore || 0));
}

function deduplicateArticles(articles) {
  const seenUrls = new Set();
  return articles.filter((a) => {
    // Exact URL deduplication (ensures 1:1 relationship between object and URL)
    if (!a.url || seenUrls.has(a.url)) return false;
    seenUrls.add(a.url);
    return true;
  });
}

export const useNewsStore = create((set, get) => ({
  articles: [],
  isLoading: false,
  isRefreshing: false,
  isFetchingMore: false,
  hasMore: true,
  cursor: null,
  newItemsAvailable: false,
  newArticlesCount: 0,
  error: null,
  cache: {}, // url -> { data, timestamp }
  activeTab: 'untukmu', // 'untukmu' | 'populer' | 'terbaru'
  seenArticleTitles: [], // Buffer to track last 48 seen titles
  seenArticleIds: new Set(), // Deduplication state across pages

  // ── Actions ──────────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchNews: async (categoryScores = {}, interactions = {}, forceRefresh = false) => {
    const cacheKey = 'main-feed';
    const cached = get().cache[cacheKey];
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL) {
      const reranked = get()._rankArticles(cached.data, categoryScores, interactions);
      set({ articles: reranked, cursor: cached.cursor, hasMore: cached.hasMore });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch('http://localhost:4000/api/v1/news');
      if (!response.ok) throw new Error('Backend API unavailable');
      
      const result = await response.json();
      const aggregatedArticles = result.feed || [];
      
      console.log(`[Store] Fetched ${aggregatedArticles.length} articles from backend.`);

      // Deduplicate and Validate
      const validArticles = validateAndFilterArticles(aggregatedArticles);
      const deduplicated = deduplicateArticles(validArticles);
      
      // Update seen IDs
      const newSeenIds = new Set(deduplicated.map(a => a.id));
      
      const ranked = get()._rankArticles(deduplicated, categoryScores, interactions);

      set({
        articles: ranked,
        isLoading: false,
        cursor: result.cursor?.last_seen_timestamp || null,
        hasMore: result.has_more,
        seenArticleIds: newSeenIds,
        cache: { 
          ...get().cache, 
          [cacheKey]: { data: deduplicated, cursor: result.cursor?.last_seen_timestamp, hasMore: result.has_more, timestamp: now } 
        },
      });
    } catch (err) {
      console.error('[Store] fetchNews error:', err);
      set({ isLoading: false, error: err.message || 'Failed to load news' });
    }
  },

  loadMoreNews: async (categoryScores = {}, interactions = {}) => {
    const state = get();
    if (state.isFetchingMore || !state.hasMore || !state.cursor) return;

    set({ isFetchingMore: true });

    try {
      const response = await fetch(`http://localhost:4000/api/v1/news?cursor=${encodeURIComponent(state.cursor)}`);
      if (!response.ok) throw new Error('Pagination API failed');

      const result = await response.json();
      const newArticles = result.feed || [];

      // Deduplicate against existing IDs
      const validNew = validateAndFilterArticles(newArticles);
      const uniqueNew = validNew.filter(a => !state.seenArticleIds.has(a.id));
      
      // Update seen IDs
      const updatedSeenIds = new Set(state.seenArticleIds);
      uniqueNew.forEach(a => updatedSeenIds.add(a.id));

      // Append correctly without changing order of previous, or just rerank the new batch and append
      const rankedNew = get()._rankArticles(uniqueNew, categoryScores, interactions);

      set({
        articles: [...state.articles, ...rankedNew],
        cursor: result.cursor?.last_seen_timestamp || null,
        hasMore: result.has_more,
        seenArticleIds: updatedSeenIds,
        isFetchingMore: false
      });
    } catch (err) {
      console.warn('[Store] Load more failed:', err);
      set({ isFetchingMore: false });
    }
  },

  checkNewItems: async () => {
    const state = get();
    if (!state.articles || state.articles.length === 0) return;
    
    // The newest article is usually the first one since it's sorted by DESC
    const topArticle = state.articles[0];
    try {
      const response = await fetch(`http://localhost:4000/api/v1/news/check-new?since=${encodeURIComponent(topArticle.publishedAt)}`);
      if (response.ok) {
        const result = await response.json();
        set({ 
          newItemsAvailable: result.new_items_available,
          newArticlesCount: result.count
        });
      }
    } catch (err) {
      console.warn('[Store] Check new items failed.', err);
    }
  },

  refreshFeed: async (categoryScores, interactions) => {
    set({ isRefreshing: true, newItemsAvailable: false, newArticlesCount: 0 });
    
    try {
      const response = await fetch('http://localhost:4000/api/v1/news/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest' }) 
      });
      
      if (response.ok) {
        const result = await response.json();
        const validArticles = validateAndFilterArticles(result.feed || []);
        const deduplicated = deduplicateArticles(validArticles);
        
        const newSeenIds = new Set(deduplicated.map(a => a.id));
        const ranked = get()._rankArticles(deduplicated, categoryScores, interactions);
        
        set({ 
          articles: ranked, 
          cursor: result.cursor?.last_seen_timestamp || null,
          hasMore: result.has_more,
          seenArticleIds: newSeenIds,
          isRefreshing: false 
        });
      } else {
        throw new Error('Refresh API failed');
      }
    } catch (err) {
      console.warn('[Store] Refresh failed.', err);
      set({ isRefreshing: false });
    }
  },

  _rankArticles: (articles, categoryScores, interactions) => {
    // 1. Base Priority Scoring (Recency, Popularity, Preference)
    const scored = [...articles]
      .map((a) => ({ ...a, _score: computeRelevanceScore(a, categoryScores, interactions) }))
      .sort((a, b) => b._score - a._score);
      
    // 2. Semantic Diversity & Category Balance Algorithm
    const balanced = [];
    const categoryCounts = {};
    const remaining = [...scored];

    // Re-order to ensure a highly diverse top 12 payload
    while (balanced.length < scored.length && remaining.length > 0) {
      let foundValidCandidate = false;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const catCount = categoryCounts[candidate.category] || 0;

        // Rule A: Category Balance (Max 3 per category within any 12-item window)
        const isStrictWindow = balanced.length < 12;
        if (isStrictWindow && catCount >= 3) {
          continue; // Skip to find a different category
        }

        // Rule B: Semantic Diversity (Prevent consecutive clustering of similar topics)
        let isTooSimilar = false;
        if (balanced.length > 0 && candidate.tags && candidate.tags.length > 0) {
          const prev = balanced[balanced.length - 1];
          if (prev.tags) {
            const overlap = candidate.tags.filter(t => prev.tags.includes(t)).length;
            if (overlap >= 2) isTooSimilar = true; // Penalize if topics are identical
          }
        }

        if (isStrictWindow && isTooSimilar) {
          continue; // Skip to find a semantically different topic
        }

        // Accept candidate
        balanced.push(candidate);
        categoryCounts[candidate.category] = catCount + 1;
        remaining.splice(i, 1);
        foundValidCandidate = true;
        break;
      }

      // Fallback: If rules are too strict and we stall, simply consume the highest remaining score
      if (!foundValidCandidate && remaining.length > 0) {
        const fallback = remaining.shift();
        balanced.push(fallback);
        categoryCounts[fallback.category] = (categoryCounts[fallback.category] || 0) + 1;
      }
    }

    return balanced;
  },

  getForYou: (interactions, selectedCategories = []) => {
    const hidden = interactions?.notInterested || new Set();
    const allArticles = get().articles.filter((a) => !hidden.has(a.id));
    
    if (selectedCategories.length === 0) return allArticles;

    // Normalize selected categories for matching
    const normalizedSelected = selectedCategories.map(c => c.toLowerCase());
    
    const filtered = allArticles.filter((a) => {
      const cat = (a.category || '').toLowerCase();
      return normalizedSelected.includes(cat);
    });

    // Fallback: If no news matches user preferences, show latest news instead of an empty screen
    return filtered.length > 0 ? filtered : allArticles;
  },

  getPopular: (interactions, selectedCategories = []) => {
    const hidden = interactions?.notInterested || new Set();
    const filtered = [...get().articles].filter((a) => 
      !hidden.has(a.id) && 
      (selectedCategories.length === 0 || selectedCategories.includes(a.category))
    );
    return filtered.sort((a, b) => b.views - a.views);
  },

  getLatest: (interactions) => {
    const hidden = interactions?.notInterested || new Set();
    const filtered = [...get().articles].filter((a) => !hidden.has(a.id));
    return filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  },

  getBookmarked: (bookmarks) => {
    return get().articles.filter((a) => bookmarks.has(a.id));
  },
}));
