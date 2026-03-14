CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  reading_level TEXT NOT NULL CHECK(reading_level IN ('young-explorer', 'curious-mind', 'deep-dive')),
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  era TEXT,
  hero_image_url TEXT,
  generated_at TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  UNIQUE(slug, reading_level)
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_generated_at ON articles(generated_at);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
