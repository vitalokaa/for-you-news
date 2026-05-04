/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NODE.JS ADVANCED RECOMMENDATION ENGINE & REFRESH FEED SYSTEM
 * ─────────────────────────────────────────────────────────────────────────────
 * Core implementation of the personalized news feed API, handling candidate
 * fetching, strict filtering, real-time learning loop scoring, and ranking.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ─── 1. MOCK DATABASE (In-Memory for demonstration) ──────────────────────────
const DB_PATH = path.join(__dirname, '../data/articles.json');
let articlesDB = [];
try {
  if (fs.existsSync(DB_PATH)) {
    articlesDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }
} catch (e) {
  console.error('Error loading articles DB', e);
}

const db = {
  user_category_weights: {}, // { userId: { categoryName: weight_float } }
  user_events: [],           // { userId, articleId, eventType, timestamp }
};

// ─── 2. REAL-TIME LEARNING SYSTEM (TRACKING) ─────────────────────────────────

/**
 * Endpoint: POST /track
 * Updates user category weights dynamically based on behavioral events.
 */
app.post('/track', (req, res) => {
  const { userId, articleId, eventType, category } = req.body;
  
  if (!userId || !articleId || !eventType || !category) {
    return res.status(400).json({ error: 'Missing required tracking fields' });
  }

  // 1. Store the event
  db.user_events.push({
    userId,
    articleId,
    eventType,
    timestamp: Date.now()
  });

  // 2. Determine Weight Delta
  let weightDelta = 0;
  switch (eventType) {
    case 'read': weightDelta = 1; break;
    case 'read_full': weightDelta = 2; break;
    case 'saved': weightDelta = 3; break;
    case 'hidden': weightDelta = -3; break;
    default: break;
  }

  // 3. Update Category Weights
  if (!db.user_category_weights[userId]) {
    db.user_category_weights[userId] = {};
  }
  
  const currentWeight = db.user_category_weights[userId][category] || 0;
  db.user_category_weights[userId][category] = currentWeight + weightDelta;
  
  // Floor to prevent permanent category ban
  if (db.user_category_weights[userId][category] < 0) {
    db.user_category_weights[userId][category] = 0;
  }

  res.json({ success: true, message: 'Event tracked and weights updated' });
});

// ─── 3. FILTERING & SCORING LOGIC ────────────────────────────────────────────

function getFilteredCandidates(userId, rawArticles) {
  // Get all user events
  const userEvents = db.user_events.filter(e => e.userId === userId);
  
  // Exclude articles marked as 'hidden' or already 'read'
  const excludedArticleIds = new Set(
    userEvents
      .filter(e => e.eventType === 'hidden' || e.eventType === 'read' || e.eventType === 'read_full')
      .map(e => e.articleId)
  );

  return rawArticles.filter(article => {
    // 1. Valid data check
    if (!article.category || !article.url) return false;
    
    // 2. Exclude previously consumed or hidden articles
    if (excludedArticleIds.has(article.id)) return false;
    
    return true;
  });
}

function scoreAndRankArticles(candidates, userWeights) {
  const now = Date.now();

  const scored = candidates.map(article => {
    let score = 0;

    // 1. Category Preference (weight * 5)
    const categoryWeight = userWeights[article.category] || 0;
    score += (categoryWeight * 5);

    // 2. Recency Score (Penalize older articles)
    const pubDate = new Date(article.publishedAt).getTime();
    const daysOld = Math.max(0, (now - pubDate) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 50 - (daysOld * 2)); // High score if new, decays daily
    score += recencyScore;

    // 3. Popularity Score (Simulated using views)
    const popularityScore = Math.min(20, ((article.views || 0) / 1000));
    score += popularityScore;

    // 4. Random Factor (To avoid repetitive feeds)
    // Injects up to 15 points of randomness
    const randomFactor = Math.floor(Math.random() * 15);
    score += randomFactor;

    return { ...article, _score: score };
  });

  // Sort descending
  return scored.sort((a, b) => b._score - a._score);
}

// ─── 4. REFRESH FEED API ENDPOINT ────────────────────────────────────────────

/**
 * Endpoint: GET /refresh
 * Returns a personalized, filtered, and scored feed.
 */
app.get('/refresh', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Load user profile weights (default to empty object)
  const userWeights = db.user_category_weights[userId] || {};

  try {
    // 1. Fetch Candidates (Limit to 200 for performance)
    // In production, this would be: SELECT * FROM articles ORDER BY publishedAt DESC LIMIT 200
    const latestArticles = articlesDB.slice(0, 200);

    // 2. Apply Filtering (Remove read/hidden/invalid)
    const candidates = getFilteredCandidates(userId, latestArticles);

    // 3. Apply Scoring & Rank
    const rankedArticles = scoreAndRankArticles(candidates, userWeights);

    // 4. Return Top 20 Articles
    const topFeed = rankedArticles.slice(0, 20);

    res.json({
      success: true,
      message: 'Updated news for you',
      data: topFeed
    });
  } catch (error) {
    console.error('Refresh API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Run server logic
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Recommendation Engine] Server running on port ${PORT}`);
  });
}

module.exports = { app, getFilteredCandidates, scoreAndRankArticles };
