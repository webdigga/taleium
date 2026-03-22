-- Character profiles (premium feature)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  appearance TEXT,
  personality TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- Junction table: which characters appear in which books
CREATE TABLE IF NOT EXISTS book_characters (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_book_characters_book ON book_characters(book_id);
CREATE INDEX IF NOT EXISTS idx_book_characters_char ON book_characters(character_id);
