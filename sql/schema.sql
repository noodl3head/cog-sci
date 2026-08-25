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

-- Mock quiz results (run this after the initial schema if upgrading)
CREATE TABLE IF NOT EXISTS mock_results (
  id            SERIAL PRIMARY KEY,
  mock_id       TEXT        NOT NULL,  -- '1'..'5' or 'generated'
  positive_marks NUMERIC(6,2) NOT NULL,
  negative_marks NUMERIC(6,2) NOT NULL,
  total_marks   NUMERIC(6,2) NOT NULL,
  time_seconds  INTEGER     NOT NULL,
  s1_correct    INTEGER     NOT NULL DEFAULT 0,
  s1_wrong      INTEGER     NOT NULL DEFAULT 0,
  s1_skipped    INTEGER     NOT NULL DEFAULT 0,
  s2_correct    INTEGER     NOT NULL DEFAULT 0,
  s2_wrong      INTEGER     NOT NULL DEFAULT 0,
  s2_skipped    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mock_results_mock_id ON mock_results (mock_id);
CREATE INDEX IF NOT EXISTS idx_mock_results_created_at ON mock_results (created_at);

-- PYQ (previous-year GATE XH-C5 papers) results. Three sections: GA, XH-B1, XH-C5.
-- total_marks is out of 100. Section stats are stored as JSON for flexibility since
-- each paper mixes MCQ/MSQ/NAT differently.
CREATE TABLE IF NOT EXISTS pyq_results (
  id            SERIAL PRIMARY KEY,
  paper_id      TEXT         NOT NULL,   -- '2024' | '2025'
  positive_marks NUMERIC(6,2) NOT NULL,
  negative_marks NUMERIC(6,2) NOT NULL,
  total_marks   NUMERIC(6,2) NOT NULL,
  time_seconds  INTEGER      NOT NULL,
  ga_net        NUMERIC(6,2) NOT NULL DEFAULT 0,
  b1_net        NUMERIC(6,2) NOT NULL DEFAULT 0,
  c5_net        NUMERIC(6,2) NOT NULL DEFAULT 0,
  sections      JSONB,                   -- full per-section breakdown
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pyq_results_paper_id ON pyq_results (paper_id);
CREATE INDEX IF NOT EXISTS idx_pyq_results_created_at ON pyq_results (created_at);

-- Rich response payloads used by the live Hermes analytics endpoint.
-- Existing rows remain valid with NULL responses.
ALTER TABLE mock_results ADD COLUMN IF NOT EXISTS responses JSONB;
ALTER TABLE pyq_results ADD COLUMN IF NOT EXISTS responses JSONB;

-- Cloud mirror for browser-local study state (SRS, revisions, key overrides,
-- generated-mock history and resumable progress). One personal app = one namespace.
CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_state_updated_at ON app_state (updated_at);
