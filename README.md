# ORACLE — Investment Intelligence

Your personal AI investing agent with persistent memory, behavioral learning, and a knowledge base you control.

## What It Does

- **Chat with ORACLE** — a deeply knowledgeable investing AI with strong opinions and a memory of everything you've told it
- **Memory that compounds** — after every conversation, ORACLE automatically extracts beliefs, preferences, knowledge gaps, and frameworks and stores them. Future conversations are informed by all prior context.
- **Knowledge ingestion** — paste in your Obsidian notes, investment memos, research papers, book excerpts. ORACLE uses these as context.
- **Full history** — all conversations saved and searchable
- **Mobile-first** — designed to work on your phone browser at all times

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend + API | Next.js 14 (App Router) |
| AI | Claude claude-sonnet-4-20250514 (Anthropic) |
| Database | Supabase (PostgreSQL) |
| Hosting | Railway |

---

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Open the **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Anthropic API Key

Get your key at [console.anthropic.com](https://console.anthropic.com)

### 3. Local Development

```bash
# Clone and install
npm install

# Set up environment
cp .env.example .env.local
# Fill in your keys in .env.local

# Run locally
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Railway

1. Push this project to a GitHub repo
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select your repo
4. In Railway's dashboard → **Variables**, add all keys from `.env.example`:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Railway auto-detects Next.js and deploys. You'll get a public URL in ~2 minutes.
6. Access it from your phone at that URL.

---

## How Memory Works

After every conversation, ORACLE automatically:
1. Sends the full conversation to Claude for analysis
2. Extracts structured signals: **beliefs**, **preferences**, **knowledge gaps**, **frameworks**
3. Stores these in Supabase
4. Injects them into the system prompt for all future conversations

Over time, ORACLE builds a detailed model of how you think about investing — and starts challenging you based on your own prior positions.

---

## Adding Your Obsidian Notes

1. Click **Ingest Notes** in the sidebar (or the + button in the Knowledge panel)
2. Select source: `Obsidian / Nimbus`
3. Paste in the note content
4. ORACLE will reference it in future conversations

For bulk ingestion from Obsidian, you can write a simple script that reads your vault markdown files and POSTs them to `/api/ingest`.

---

## Roadmap for Future Versions

- [ ] Auth (multiple users / private access)
- [ ] Bulk Obsidian vault ingestion script
- [ ] Vector embeddings for semantic knowledge search (pgvector)
- [ ] Live market data tool (web search integration)
- [ ] Voice input on mobile
- [ ] Multiple agents (Compliance, Personal Finance, etc.)
- [ ] Weekly "what have I been thinking about?" digest
