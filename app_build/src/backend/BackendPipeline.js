/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NEWS AGGREGATOR BACKEND PIPELINE & DATABASE SCHEMA
 * ─────────────────────────────────────────────────────────────────────────────
 * This file demonstrates the production-ready Database Schema, Ingestion Pipeline,
 * Validation Logic, and an Express.js API Endpoint to serve high-quality news
 * from the last 5 years.
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Mocking a Database ORM (like Prisma or Sequelize)
const db = {
  articles: [],
  sources: [
    { id: 's1', name: 'BBC', domain: 'bbc.com', trustScore: 0.95, isActive: true },
    { id: 's2', name: 'CNN', domain: 'cnn.com', trustScore: 0.90, isActive: true },
    { id: 's3', name: 'Reuters', domain: 'reuters.com', trustScore: 0.98, isActive: true },
    { id: 's4', name: 'The Guardian', domain: 'theguardian.com', trustScore: 0.92, isActive: true },
    { id: 's5', name: 'TechCrunch', domain: 'techcrunch.com', trustScore: 0.88, isActive: true },
  ],
  categories: [
    { id: 'c1', name: 'Teknologi' },
    { id: 'c2', name: 'Bisnis' },
    { id: 'c3', name: 'Olahraga' },
  ],
  article_embeddings: []
};

// ─── 1. DATABASE SCHEMA DESIGN (Pseudo-SQL / Prisma structure) ───────────────
/*
  Table: articles
    - id: UUID (Primary Key)
    - title: TEXT (Required)
    - description: TEXT
    - content: TEXT
    - imageUrl: VARCHAR
    - source: VARCHAR (Foreign Key or String)
    - category: VARCHAR
    - publishedAt: TIMESTAMP (Required, Indexed for sorting)
    - url: VARCHAR (UNIQUE, Required)
    - createdAt: TIMESTAMP (Default: NOW())

  Table: sources
    - id: UUID (Primary Key)
    - name: VARCHAR (e.g. BBC, Reuters)
    - domain: VARCHAR
    - trustScore: FLOAT (0.0 - 1.0)
    - isActive: BOOLEAN

  Table: categories
    - id: UUID (Primary Key)
    - name: VARCHAR (Unique)

  Table: article_embeddings (For AI Vector Search)
    - articleId: UUID (Foreign Key)
    - vector: JSONB / FLOAT ARRAY
*/

// ─── 2. VALIDATION CONSTANTS & HELPERS ───────────────────────────────────────
const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:" && url.pathname.length > 1; // Block domain roots
  } catch (e) {
    return false;
  }
}

// ─── 3. DATA INGESTION PIPELINE ──────────────────────────────────────────────
class NewsIngestionPipeline {
  
  /**
   * Main entry point to ingest data from external APIs
   */
  async runPipeline(rawArticlesFromApi) {
    console.log(`Starting ingestion of ${rawArticlesFromApi.length} articles...`);
    
    // 1. Validate & Normalize
    const validArticles = this.validateAndNormalize(rawArticlesFromApi);
    
    // 2. Deduplicate against incoming batch and existing database
    const newArticles = this.deduplicate(validArticles);
    
    // 3. Save to Database
    const savedCount = await this.saveToDatabase(newArticles);
    console.log(`Pipeline complete. Saved ${savedCount} new articles.`);
  }

  /**
   * Validate fields and enforce the strict 5-year and URL rules.
   */
  validateAndNormalize(articles) {
    const now = Date.now();
    const valid = [];

    for (const article of articles) {
      // Must have critical fields
      if (!article.title || !article.url || !article.source || !article.publishedAt) {
        continue;
      }

      // Must be a valid, secure URL
      if (!isValidUrl(article.url)) {
        continue;
      }

      // Date must be valid and within the last 5 years
      const pubDate = new Date(article.publishedAt).getTime();
      if (isNaN(pubDate) || (now - pubDate > FIVE_YEARS_MS)) {
        continue;
      }

      // Check if source is in our trusted active list
      const isTrustedSource = db.sources.some(s => s.isActive && article.source.includes(s.name));
      if (!isTrustedSource) {
        continue; // Reject untrusted/unknown blogs
      }

      valid.push({
        id: uuidv4(),
        title: article.title.trim(),
        description: article.description || '',
        content: article.content || '',
        imageUrl: article.imageUrl || null,
        source: article.source,
        category: article.category || 'General',
        publishedAt: new Date(pubDate).toISOString(),
        url: article.url,
        createdAt: new Date().toISOString()
      });
    }

    return valid;
  }

  /**
   * Deduplicate using exact URL matching to prevent overwriting or mixing
   */
  deduplicate(articles) {
    const uniqueBatch = [];
    const seenUrlsInBatch = new Set();
    
    // Create a Set of existing URLs from DB for O(1) lookup
    const existingDbUrls = new Set(db.articles.map(a => a.url));

    for (const article of articles) {
      if (seenUrlsInBatch.has(article.url) || existingDbUrls.has(article.url)) {
        continue; // Skip duplicate URL
      }
      seenUrlsInBatch.add(article.url);
      uniqueBatch.push(article);
    }

    return uniqueBatch;
  }

  async saveToDatabase(articles) {
    // In production: await prisma.articles.createMany({ data: articles })
    db.articles.push(...articles);
    return articles.length;
  }
}

// ─── 4. API ENDPOINT (EXPRESS.JS) ────────────────────────────────────────────
const app = express();
app.use(express.json());

/**
 * GET /api/v1/articles
 * Fetches validated articles exclusively from the database, sorted by recency
 */
app.get('/api/v1/articles', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    // Base Query: Only return valid database records (never fetch directly from external APIs here)
    let query = db.articles;

    // Filter by category if requested
    if (category) {
      query = query.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    // Sort by Recency (publishedAt DESC)
    query.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = query.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      count: paginatedResults.length,
      page: Number(page),
      data: paginatedResults
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = { NewsIngestionPipeline, app };
