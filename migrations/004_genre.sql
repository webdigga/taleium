-- Add genre column to books (premium feature)
ALTER TABLE books ADD COLUMN genre TEXT DEFAULT NULL;
