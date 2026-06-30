-- Run this once against your Neon Postgres database before using the app.
-- Easiest way: open the Vercel dashboard -> Storage -> your Postgres integration -> Query tab,
-- paste this in, and run it. Or use `psql "$DATABASE_URL" -f sql/schema.sql` locally.

CREATE TABLE IF NOT EXISTS attempts (
  id SERIAL PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  selected_letter TEXT NOT NULL,
  correct_letter TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_chapter ON attempts (book_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts (book_id, chapter_id, question_number);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts (created_at);
