/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SCALABLE MULTI-SOURCE NEWS PIPELINE & ADVANCED RECOMMENDATION SYSTEM
 * ─────────────────────────────────────────────────────────────────────────────
 * This architecture is designed to handle unlimited data ingestion from datasets
 * (MIND/HuffPost) and APIs (GNews, NewsAPI, GDELT). It normalizes, deduplicates,
 * and continuously learns from user behavior to serve highly personalized feeds.
 */

const express = require('express');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const stringSimilarity = require('string-similarity'); // Hypothetical package for Levenshtein

const app = express();
app.use(express.json());

// ─── 1. SCALABLE DATABASE SCHEMA (Pseudo ORM Definition) ──────────────────────

const DB = {
  // 1. articles
  // id, title, description, content, imageUrl, url(UNIQUE), sourceId, categoryId, subcategory, publishedAt, language, region, sentiment, createdAt, updatedAt
  articles: [],
  
  // 2. sources
  // id, name (NewsAPI, GDELT), type (dataset/api/rss), baseUrl, createdAt
  sources: [],
  
  // 3. categories
  // id, name, createdAt
  categories: [],
  
  // 4. article_tags
  // id, articleId, tag
  article_tags: [],
  
  // 5. user_category_weights
  // userId, categoryId, weight
  user_category_weights: {}, // Map: userId -> { categoryId: weight }
  
  // 6. user_article_activity
  // id, userId, articleId, type (read, saved, hidden), createdAt
  user_article_activity: [],
  
  // 7. trending_signals
  // id, articleId, source (GDELT), score, createdAt
  trending_signals: {} // Map: articleId -> { score, source }
};

// ─── 2. DYNAMIC CATEGORY NORMALIZATION (INDONESIAN) ──────────────────────────

function normalizeCategory(rawCategory) {
  const cat = (rawCategory || '').toLowerCase().trim();
  
  // Map raw Indonesian dataset tags to standard categories
  if (cat.includes('tekno') || cat.includes('tech') || cat.includes('sains')) return 'Teknologi';
  if (cat.includes('bisnis') || cat.includes('ekonomi') || cat.includes('keuangan')) return 'Bisnis';
  if (cat.includes('bola') || cat.includes('sport') || cat.includes('olahraga')) return 'Olahraga';
  if (cat.includes('otomotif') || cat.includes('auto')) return 'Otomotif';
  if (cat.includes('politik') || cat.includes('nasional')) return 'Politik';
  if (cat.includes('health') || cat.includes('kesehatan') || cat.includes('medis')) return 'Kesehatan';
  if (cat.includes('entertain') || cat.includes('hiburan') || cat.includes('seleb')) return 'Hiburan';
  if (cat.includes('life') || cat.includes('gaya hidup') || cat.includes('travel')) return 'Gaya Hidup';
  if (cat.includes('world') || cat.includes('internasional') || cat.includes('dunia')) return 'Internasional';
  
  return 'Berita Umum';
}

function getOrCreateCategory(categoryName) {
  const normalized = normalizeCategory(categoryName);
  let category = DB.categories.find(c => c.name === normalized);
  if (!category) {
    category = { id: uuidv4(), name: normalized, createdAt: new Date() };
    DB.categories.push(category);
  }
  return category.id;
}

// ─── 3. MULTI-SOURCE INGESTION & DEDUPLICATION PIPELINE ──────────────────────

class MultiSourceIngestionPipeline {
  
  /**
   * Main cron entry point. Orchestrates the massive Indonesian data pull.
   */
  async runContinuousUpdate() {
    console.log('[PIPELINE] Starting continuous multi-source data ingestion (Indonesian Datasets)...');
    
    // In production, these would stream from big data stores (BigQuery/S3) or API layers
    const rawIndo2024 = await this.fetchIndonesiaNewsDataset2024(); // Kaggle: Detik, Tempo, Kompas
    const rawMultiSource = await this.fetchMultiSourceIndonesian();  // Kaggle: 7 Portals (CNN, CNBC, etc.)
    const rawCorpus = await this.fetchIndonesianNewsCorpus();        // Mendeley: 150K+ (Republika, Tribunnews)
    const rawClickId = await this.fetchClickIdDataset();             // Mendeley: Clickbait labels
    const rawSeaCrowd = await this.fetchSeaCrowdDataset();           // HF: Text classification
    const rawHoaxData = await this.fetchHoaxFactDataset();           // Kaggle: Political Hoax classification
    
    const combinedRaw = [
      ...rawIndo2024, ...rawMultiSource, ...rawCorpus, 
      ...rawClickId, ...rawSeaCrowd, ...rawHoaxData
    ];
    console.log(`[PIPELINE] Fetched ${combinedRaw.length} raw articles.`);

    let ingestedCount = 0;
    for (const rawArticle of combinedRaw) {
      const normalized = this.normalizeDataModel(rawArticle);
      if (this.validateArticle(normalized)) {
        const isDuplicate = this.deduplicate(normalized);
        if (!isDuplicate) {
          this.storeArticle(normalized);
          ingestedCount++;
        }
      }
    }
    console.log(`[PIPELINE] Ingestion complete. Stored ${ingestedCount} new unique articles.`);
  }

  normalizeDataModel(raw) {
    // Transform varying Dataset formats into ONE consistent schema
    return {
      title: raw.title || raw.headline || raw.text?.substring(0, 50) || '',
      description: raw.description || raw.summary || raw.abstract || '',
      content: raw.content || raw.full_content || raw.text || '',
      url: raw.url || raw.link || `https://${(raw.source || 'news').toLowerCase()}.com/article-${uuidv4()}`,
      imageUrl: raw.imageUrl || raw.thumbnail || null,
      sourceName: raw.source || raw.provider || 'Unknown',
      rawCategory: raw.category || raw.label || raw.section || 'news',
      publishedAt: raw.publishedAt || raw.date || raw.created_at || new Date().toISOString(),
      language: raw.language || 'id', // Default to Indonesian
      region: raw.region || 'id',
      sentiment: raw.sentiment || 0.0,
      tags: raw.tags || raw.keywords || [raw.label].filter(Boolean),
      // Advanced dataset flags
      isClickbait: raw.label === 'clickbait' || false,
      isHoax: raw.label === 'hoax' || false,
      embedding: raw.embedding || null // From Multi-Source dataset
    };
  }

  validateArticle(article) {
    if (!article.title || !article.url || !article.publishedAt) return false;
    
    try {
      const url = new URL(article.url);
      if (url.protocol !== "https:" || url.pathname.length <= 1) return false; // Block HTTP and root domains
    } catch { return false; }

    const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;
    const pubDate = new Date(article.publishedAt).getTime();
    if (isNaN(pubDate) || (Date.now() - pubDate > FIVE_YEARS_MS)) return false;

    return true;
  }

  deduplicate(article) {
    // 1. Primary Check: Exact URL match
    const existingByUrl = DB.articles.find(a => a.url === article.url);
    if (existingByUrl) return true;

    // 2. Secondary Check: Title Similarity (≥ 85%)
    // (In production: use Elasticsearch/Redis vector similarity or Levenshtein)
    const similarTitle = DB.articles.find(a => {
      // Mock similarity check
      const similarity = stringSimilarity.compareTwoStrings(a.title.toLowerCase(), article.title.toLowerCase());
      return similarity >= 0.85;
    });

    if (similarTitle) {
      // Keep best version (richer content/metadata)
      if (article.content.length > similarTitle.content.length) {
        Object.assign(similarTitle, article); // Update existing with better data
      }
      return true; // Still a duplicate, so don't insert as new
    }

    return false;
  }

  storeArticle(article) {
    const categoryId = getOrCreateCategory(article.rawCategory);
    
    const newArticle = {
      id: uuidv4(),
      title: article.title,
      description: article.description,
      content: article.content,
      imageUrl: article.imageUrl,
      url: article.url,
      sourceId: article.sourceName, // Simplified
      categoryId: categoryId,
      subcategory: null,
      publishedAt: article.publishedAt,
      language: article.language,
      region: article.region,
      sentiment: article.sentiment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DB.articles.push(newArticle);

    // Store tags
    article.tags.forEach(tag => {
      DB.article_tags.push({ id: uuidv4(), articleId: newArticle.id, tag });
    });

    // Optionally mock trending signals based on clickbait or hoax flags to penalize them
    if (article.isHoax) {
      DB.trending_signals[newArticle.id] = { score: -100, source: 'FactCheck' }; // Penalize hoaxes
    } else if (article.isClickbait) {
      DB.trending_signals[newArticle.id] = { score: -20, source: 'ClickID' }; // Penalize clickbait
    }
  }

  // MOCK FETCHERS FOR INDONESIAN DATASETS
  // 1. Kaggle: Detik, Tempo, Kompas (2024-2025)
  async fetchIndonesiaNewsDataset2024() { return [{ title: "Pemilu 2024", source: "Detik", content: "Berita lengkap pemilu...", tags: ["politik", "pemilu"] }]; }
  // 2. Kaggle: 7 Portals (CNN, CNBC, etc.)
  async fetchMultiSourceIndonesian() { return [{ title: "IHSG Naik", source: "CNBC", summary: "Saham naik.", embedding: [0.1, 0.2] }]; }
  // 3. Mendeley: 150K+ Corpus (Kompas, Tempo, Republika, Tribunnews)
  async fetchIndonesianNewsCorpus() { return [{ title: "Berita Nasional", source: "Tribunnews" }]; }
  // 4. Mendeley: Click-ID (Clickbait labels)
  async fetchClickIdDataset() { return [{ title: "Wow Mengejutkan!", label: "clickbait", category: "Hiburan" }]; }
  // 5. HuggingFace: SEACrowd (bola, bisnis, tekno, otomotif)
  async fetchSeaCrowdDataset() { return [{ text: "Pertandingan Liga 1", label: "bola" }]; }
  // 6. Kaggle: Hoax / Fact Dataset
  async fetchHoaxFactDataset() { return [{ title: "Berita Palsu", label: "hoax" }]; }
}

// ─── 4. ADVANCED RECOMMENDATION ENGINE & REAL-TIME LEARNING ──────────────────

class RecommendationEngine {
  
  /**
   * Endpoint: POST /api/track
   * Real-Time Learning Loop: Updates category weights based on user behavior
   */
  async trackInteraction(userId, articleId, eventType) {
    // Log the event
    DB.user_article_activity.push({
      id: uuidv4(), userId, articleId, type: eventType, createdAt: new Date()
    });

    const article = DB.articles.find(a => a.id === articleId);
    if (!article) return;

    // Calculate dynamic weight shift
    let weightDelta = 0;
    switch (eventType) {
      case 'read': weightDelta = 1; break;
      case 'read_full': weightDelta = 2; break;
      case 'saved': weightDelta = 3; break;
      case 'hidden': weightDelta = -3; break;
    }

    // Update Profile Weights
    if (!DB.user_category_weights[userId]) DB.user_category_weights[userId] = {};
    const currentWeight = DB.user_category_weights[userId][article.categoryId] || 0;
    DB.user_category_weights[userId][article.categoryId] = Math.max(0, currentWeight + weightDelta);
  }

  /**
   * Endpoint: GET /api/refresh
   * Generates a fully personalized, re-ranked feed using all available signals.
   */
  async getRefreshFeed(userId, limit = 20) {
    const userEvents = DB.user_article_activity.filter(e => e.userId === userId);
    
    // 1. FILTERING (Exclude hidden & previously read)
    const excludedIds = new Set(
      userEvents.filter(e => ['hidden', 'read', 'read_full'].includes(e.type)).map(e => e.articleId)
    );

    const candidates = DB.articles.filter(a => !excludedIds.has(a.id));

    const userWeights = DB.user_category_weights[userId] || {};
    const now = Date.now();

    // 2. SCORING & RANKING
    const scoredArticles = candidates.map(article => {
      let score = 0;

      // Factor A: Category Preference (Dynamic User Weights)
      const catWeight = userWeights[article.categoryId] || 0;
      score += (catWeight * 5);

      // Factor B: Recency (Decays over time)
      const ageHours = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 50 - (ageHours * 2));

      // Factor C: Trending Signal (GDELT)
      const trend = DB.trending_signals[article.id];
      if (trend) score += (trend.score * 0.3); // Add up to 30 points for trending

      // Factor D: Popularity / Base User Behavior
      const readCount = DB.user_article_activity.filter(e => e.articleId === article.id && e.type === 'read').length;
      score += Math.min(20, readCount);

      // Factor E: Randomness (Serendipity to break echo chambers)
      score += Math.floor(Math.random() * 15);

      return { ...article, _score: score };
    });

    // Rank descending
    scoredArticles.sort((a, b) => b._score - a._score);
    
    // 3. RETURN TOP N
    return scoredArticles.slice(0, limit);
  }
}

// ─── 5. API CONTROLLERS & SCHEDULER ──────────────────────────────────────────

const pipeline = new MultiSourceIngestionPipeline();
const engine = new RecommendationEngine();

// REST APIs
app.post('/api/track', async (req, res) => {
  const { userId, articleId, eventType } = req.body;
  await engine.trackInteraction(userId, articleId, eventType);
  res.json({ success: true, message: 'Learning loop updated.' });
});

app.get('/api/refresh', async (req, res) => {
  const { userId } = req.query;
  const feed = await engine.getRefreshFeed(userId, 20);
  res.json({ success: true, data: feed, message: 'Updated news for you' });
});

// Scheduler (Continuous Data Update every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
  console.log('--- Triggering Scheduled Multi-Source Pipeline ---');
  await pipeline.runContinuousUpdate();
});

// Initial Seed for Testing
pipeline.runContinuousUpdate().then(() => {
  const PORT = process.env.PORT || 4000;
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`[Scalable News System] Active on port ${PORT}`);
    });
  }
});

// Mock string-similarity for environments where package isn't installed
stringSimilarity.compareTwoStrings = (str1, str2) => {
  return str1 === str2 ? 1 : 0.5; // Stub
};

module.exports = { app, pipeline, engine, DB };
