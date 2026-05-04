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
  let score = 0;

  // 1. Real-Time Category Weight → 40%
  const realTimeCategoryWeight = Math.min(100, categoryScores[article.category] || 30);
  score += realTimeCategoryWeight * 0.40;

  // 2. Behavior Score (Based on read time, scroll depth, and clicks) → 20%
  const clickCount = interactions.clicks?.[article.id] || 0;
  const readSeconds = interactions.readTime?.[article.id] || 0;
  const scrollBoost = (interactions.scrollDepth?.[article.id] || 0) * 0.3;
  let behaviorScore = Math.min(100, (clickCount * 10) + (readSeconds / 5) + scrollBoost);
  if (interactions.bookmarked?.has(article.id)) behaviorScore += 50; // Bookmarking is a massive behavior signal
  behaviorScore = Math.min(100, behaviorScore);
  score += behaviorScore * 0.20;

  // 3. Recency Score → 15%
  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  const recencyScore = Math.max(0, 100 - ageHours * 2.5);
  score += recencyScore * 0.15;

  // 4. Popularity Score → 15%
  const popularityScore = Math.min(100, (article.views / 1000) * 2);
  score += popularityScore * 0.15;

  // 5. Source Trust Score → 10%
  const trustedSources = ['BBC', 'CNN', 'Reuters', 'The Guardian', 'TechCrunch'];
  const sourceTrustScore = trustedSources.some(s => article.source.includes(s)) ? 100 : 50;
  score += sourceTrustScore * 0.10;

  // Penalty: "Not Interested" topics
  const penalty = interactions.notInterestedTopics?.[article.category] || 0;
  score -= penalty * 0.05;

  return Math.max(0, Math.min(100, score));
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
  error: null,
  cache: {}, // url -> { data, timestamp }
  activeTab: 'untukmu', // 'untukmu' | 'populer' | 'terbaru'
  seenArticleTitles: [], // Buffer to track last 48 seen titles

  // ── Actions ──────────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchNews: async (categoryScores = {}, interactions = {}, forceRefresh = false) => {
    const cacheKey = 'main-feed';
    const cached = get().cache[cacheKey];
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL) {
      // Use cached data — rerank with current preferences
      const reranked = get()._rankArticles(cached.data, categoryScores, interactions);
      set({ articles: reranked });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 1200));

      // ── Multi-Source Aggregation with Fallback Strategy ──────────────
      // Reading from our seeded database instead of the simulated array
      let aggregatedArticles = [...REAL_DATABASE];
      
      try {
        // Try to simulate fetching from Primary Source A
        const sourceA_Data = aggregatedArticles.slice(0, 150); 
        
        // Try to simulate fetching from Backup Source B
        const sourceB_Data = aggregatedArticles.slice(150);

        // Merge and normalize results
        aggregatedArticles = [...sourceA_Data, ...sourceB_Data];
      } catch (sourceError) {
        console.warn('Sources failed, using fallback source C', sourceError);
        aggregatedArticles = REAL_DATABASE; 
      }

      // Simulate a new article coming in from the API on refresh
      if (forceRefresh) {
        const randomInt = Math.floor(Math.random() * 1000);
        aggregatedArticles.unshift({
          id: `art-refresh-${randomInt}`,
          title: `BBC News World Edition - Breaking Stories (${randomInt})`,
          summary: 'This dynamically refreshed article links strictly to a valid BBC news aggregate endpoint.',
          imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80&random=${randomInt}`,
          source: 'BBC News',
          sourceUrl: 'https://bbc.com',
          url: `https://www.bbc.com/news/world`,
          category: 'Dunia',
          publishedAt: new Date().toISOString(), // Current time makes it highest recency
          readTimeMinutes: 2,
          views: 1200,
          isHero: false,
          tags: ['live', 'update', 'berita'],
          embedding: null,
        });
      }

      // Deduplicate and Validate (merges sources cleanly & strictly removes invalid URLs)
      const validArticles = validateAndFilterArticles(aggregatedArticles);
      const deduplicated = deduplicateArticles(validArticles);
      const ranked = get()._rankArticles(deduplicated, categoryScores, interactions);

      set({
        articles: ranked,
        isLoading: false,
        cache: { ...get().cache, [cacheKey]: { data: deduplicated, timestamp: now } },
      });
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to load news' });
    }
  },

  refreshFeed: async (categoryScores, interactions) => {
    set({ isRefreshing: true });
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    set((state) => {
      // Track currently displayed titles to avoid consecutive repetition
      const currentShownTitles = state.articles.slice(0, 12).map(a => a.title);
      
      // Update history buffer (keep last 48 titles)
      const newSeenTitles = [...state.seenArticleTitles, ...currentShownTitles].slice(-48);
      const seenSet = new Set(newSeenTitles);

      // Access the full dataset pool
      const fullPool = state.cache['main-feed']?.data || state.articles;

      // Filter out items with titles we've seen recently
      const freshCandidates = fullPool.filter(a => !seenSet.has(a.title));

      // Shuffle to ensure we grab different categories/sources if tied
      const shuffled = [...freshCandidates].sort(() => Math.random() - 0.5);
      let reRanked = get()._rankArticles(shuffled, categoryScores, interactions);
      
      // Fallback: If dataset runs out of fresh items, fallback to full pool
      if (reRanked.length < 12) {
        reRanked = get()._rankArticles(fullPool, categoryScores, interactions);
      }
      
      return { 
        articles: reRanked, 
        seenArticleTitles: newSeenTitles,
        isRefreshing: false 
      };
    });
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
    return get().articles.filter((a) => 
      !hidden.has(a.id) && 
      (selectedCategories.length === 0 || selectedCategories.includes(a.category))
    ).slice(0, 12);
  },

  getPopular: (interactions, selectedCategories = []) => {
    const hidden = interactions?.notInterested || new Set();
    const filtered = [...get().articles].filter((a) => 
      !hidden.has(a.id) && 
      (selectedCategories.length === 0 || selectedCategories.includes(a.category))
    );
    return filtered.sort((a, b) => b.views - a.views).slice(0, 12);
  },

  getLatest: (interactions, selectedCategories = []) => {
    const hidden = interactions?.notInterested || new Set();
    const filtered = [...get().articles].filter((a) => 
      !hidden.has(a.id) && 
      (selectedCategories.length === 0 || selectedCategories.includes(a.category))
    );
    return filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 12);
  },

  getBookmarked: (bookmarks) => {
    return get().articles.filter((a) => bookmarks.has(a.id));
  },
}));
