-- ============================================
-- ORACLE: Investment Intelligence — DB Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Conversations ──────────────────────────────────────────────────
CREATE TABLE conversations (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT NOT NULL DEFAULT 'New Conversation',
  last_message  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ───────────────────────────────────────────────────────
CREATE TABLE messages (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_conversation_idx ON messages(conversation_id);

-- ── Memories (behavioral learning) ────────────────────────────────
CREATE TABLE memories (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type             TEXT NOT NULL CHECK (type IN ('belief', 'preference', 'knowledge_gap', 'framework', 'question', 'context')),
  content          TEXT NOT NULL,
  confidence       TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Knowledge Base (ingested documents/notes) ──────────────────────
CREATE TABLE knowledge (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  source      TEXT DEFAULT 'manual',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security (RLS) ────────────────────────────────────────
-- Since this is a personal tool, we disable RLS and use service role key on server
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;
