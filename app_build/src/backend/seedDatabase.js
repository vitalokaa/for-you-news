const fs = require('fs');
const path = require('path');
const https = require('https');

// Fetch generally to get a mix of all available categories
const GUARDIAN_API_URL = 'https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,trailText,bodyText,wordcount&page-size=50';

function fetchGuardianNews(page) {
  return new Promise((resolve, reject) => {
    const url = `${GUARDIAN_API_URL}&page=${page}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.response.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

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
  
  // Normalization and Merging rules
  if (cat.includes('tech') || cat.includes('science')) return 'Technology';
  if (cat.includes('business') || cat.includes('finance') || cat.includes('money')) return 'Business';
  if (cat.includes('sport') || cat.includes('football')) return 'Sports';
  if (cat.includes('world') || cat.includes('global') || cat.includes('news')) return 'World News';
  if (cat.includes('health') || cat.includes('medicine')) return 'Health';
  if (cat.includes('politics') || cat.includes('law')) return 'Politics';
  if (cat.includes('entertainment') || cat.includes('music') || cat.includes('film') || cat.includes('culture') || cat.includes('art') || cat.includes('television')) return 'Entertainment';
  if (cat.includes('life') || cat.includes('style') || cat.includes('fashion') || cat.includes('food')) return 'Lifestyle';
  if (cat.includes('environment')) return 'Environment';
  if (cat.includes('education')) return 'Education';
  
  // Fallback string manipulation
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

async function seedDatabase() {
  console.log('Starting Dataset Extraction & Ingestion Pipeline...');
  const allArticles = [];
  const seenUrls = new Set();
  const categorySet = new Set();

  let page = 1;
  let collected = 0;
  const targetArticles = 300;

  while (collected < targetArticles && page <= 20) {
    console.log(`Fetching from The Guardian Dataset (Page ${page})...`);
    try {
      const results = await fetchGuardianNews(page);
      const now = Date.now();

      for (const item of results) {
        const fields = item.fields || {};
        
        // Dynamic Category Extraction
        const rawCategory = item.sectionName || 'General';
        const normalizedCategory = normalizeCategory(rawCategory);

        const article = {
          id: `dataset-${item.id.replace(/\//g, '-')}`,
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

        // 1. Minimum Data Requirements
        if (!article.title || !article.url || !article.source || !article.publishedAt) continue;
        if (!isValidUrl(article.url)) continue;
        
        const pubDate = new Date(article.publishedAt).getTime();
        if (isNaN(pubDate) || (now - pubDate > FIVE_YEARS_MS)) continue;

        if (article.content.split(' ').length < 50 && article.description.length < 50) continue;

        // 2. Deduplication
        if (seenUrls.has(article.url)) continue;

        // 3. Keep Valid Entry
        seenUrls.add(article.url);
        categorySet.add(normalizedCategory);
        allArticles.push(article);
        collected++;
        
        if (collected >= targetArticles) break;
      }
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
    }
    page++;
  }

  // Generate Categories Database
  const categoriesDb = Array.from(categorySet).map((name, idx) => ({
    id: `cat-${idx + 1}`,
    name
  }));

  console.log(`Pipeline complete. Extracted ${categoriesDb.length} unique dynamic categories.`);
  console.log(`Collected ${allArticles.length} valid articles.`);

  const dbDataPath = path.join(__dirname, '../data/articles.json');
  const dbCatPath = path.join(__dirname, '../data/categories.json');
  
  fs.writeFileSync(dbDataPath, JSON.stringify(allArticles, null, 2));
  fs.writeFileSync(dbCatPath, JSON.stringify(categoriesDb, null, 2));
  
  console.log(`Articles database seeded at ${dbDataPath}`);
  console.log(`Categories database seeded at ${dbCatPath}`);
}

seedDatabase();
