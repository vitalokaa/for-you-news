const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── DAILY DATASET UPDATE PIPELINE ───────────────────────────────────────────
// This cron job runs every 24 hours to automatically fetch, validate, and merge
// fresh news articles from trusted APIs, ensuring the local dataset is never stale.
// It directly supports the continuous learning recommendation engine.

const DB_PATH = path.join(__dirname, '../data/articles.json');
const CAT_PATH = path.join(__dirname, '../data/categories.json');

// Trusted Source Configuration
const TRUSTED_SOURCES = ['bbc.com', 'cnn.com', 'reuters.com', 'techcrunch.com', 'theguardian.com'];
const GUARDIAN_API_URL = 'https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText,bodyText,wordcount&page-size=50';
const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:" && url.pathname.length > 1;
  } catch (e) {
    return false;
  }
}

function normalizeCategory(rawCategory) {
  let cat = rawCategory.toLowerCase().trim();
  if (cat.includes('tech') || cat.includes('science')) return 'Technology';
  if (cat.includes('business') || cat.includes('finance')) return 'Business';
  if (cat.includes('sport')) return 'Sports';
  if (cat.includes('world') || cat.includes('news')) return 'World News';
  if (cat.includes('health')) return 'Health';
  if (cat.includes('politics')) return 'Politics';
  if (cat.includes('entertainment') || cat.includes('music') || cat.includes('film')) return 'Entertainment';
  if (cat.includes('life') || cat.includes('style')) return 'Lifestyle';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function fetchLatestNews() {
  return new Promise((resolve, reject) => {
    https.get(`${GUARDIAN_API_URL}&order-by=newest`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).response.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runDailyUpdate() {
  console.log('[CRON] Starting Daily Dataset Update Job...');
  
  // 1. Load Existing Database
  let existingArticles = [];
  let existingCategories = [];
  try {
    if (fs.existsSync(DB_PATH)) existingArticles = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (fs.existsSync(CAT_PATH)) existingCategories = JSON.parse(fs.readFileSync(CAT_PATH, 'utf-8'));
  } catch (e) {
    console.error('Failed to load existing DB', e);
  }

  // O(1) Lookups for Deduplication
  const seenUrls = new Set(existingArticles.map(a => a.url));
  const categorySet = new Set(existingCategories.map(c => c.name));

  let newArticlesCount = 0;

  try {
    // 2. Fetch Fresh Data (Simulating combining NewsAPI, GNews, RSS via Guardian API for this demo)
    const freshArticles = await fetchLatestNews();
    const now = Date.now();

    for (const item of freshArticles) {
      const fields = item.fields || {};
      const normalizedCategory = normalizeCategory(item.sectionName || 'General');

      const article = {
        id: `daily-${Date.now()}-${item.id.replace(/\//g, '-')}`,
        title: item.webTitle,
        description: fields.trailText ? fields.trailText.replace(/(<([^>]+)>)/gi, "") : '',
        content: fields.bodyText || '',
        imageUrl: fields.thumbnail || null,
        source: 'The Guardian',
        category: normalizedCategory,
        publishedAt: item.webPublicationDate,
        url: item.webUrl,
        createdAt: new Date().toISOString()
      };

      // 3. Validation Rules
      if (!article.title || !article.url || !article.source || !article.publishedAt) continue;
      if (!isValidUrl(article.url)) continue;
      
      const pubDate = new Date(article.publishedAt).getTime();
      if (isNaN(pubDate) || (now - pubDate > FIVE_YEARS_MS)) continue;
      if (article.content.split(' ').length < 50) continue; // Must have real content

      // 4. Deduplicate
      if (seenUrls.has(article.url)) continue;

      // 5. Store & Sync
      seenUrls.add(article.url);
      categorySet.add(normalizedCategory);
      
      // Prepend to array so it gets high recency score natively
      existingArticles.unshift(article);
      newArticlesCount++;
    }

    if (newArticlesCount > 0) {
      // Generate updated categories
      const categoriesDb = Array.from(categorySet).map((name, idx) => ({ id: `cat-${idx + 1}`, name }));
      
      fs.writeFileSync(DB_PATH, JSON.stringify(existingArticles, null, 2));
      fs.writeFileSync(CAT_PATH, JSON.stringify(categoriesDb, null, 2));
      console.log(`[CRON] Success! Added ${newArticlesCount} fresh articles to the database.`);
    } else {
      console.log('[CRON] No new valid articles found today.');
    }
  } catch (error) {
    console.error('[CRON] Pipeline Error:', error);
  }
}

// Schedule Job: Run every 24 hours at midnight
cron.schedule('0 0 * * *', () => {
  runDailyUpdate();
});

// Run immediately for demonstration
if (require.main === module) {
  runDailyUpdate();
}

module.exports = { runDailyUpdate };
