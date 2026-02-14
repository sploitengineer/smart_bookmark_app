# SmartMark — AI-Powered Bookmark Manager

A real-time, AI-powered bookmark manager built with **Next.js 15 (App Router)**, **Supabase** (Auth, Database, Realtime), **Groq AI** (LLaMA 3.1), and **Tailwind CSS v4**.

## Live Demo

🔗 [Deployed on Vercel](#) *(URL to be added after deployment)*

---

## Features

### Core
- **Google OAuth Sign-In** — One-click authentication via Supabase Auth
- **Private Bookmarks** — Row Level Security (RLS) ensures users only see their own data
- **Real-time Sync** — Changes appear instantly across all open tabs via Supabase Realtime
- **Optimistic UI** — Bookmarks appear immediately after save, no waiting for Realtime

### AI-Powered (Groq LLaMA 3.1)
- **AI Auto-Summary** — Paste a URL → AI generates a 1-line summary automatically
- **AI Auto-Tags** — Automatic tag generation (e.g., `react`, `javascript`, `frontend`)
- **AI Category** — Auto-categorization (Development, AI/ML, Design, etc.)
- **Smart Search** — Natural language search: *"show my React bookmarks"*

### UI/UX
- **Thumbnail Previews** — OG image thumbnails via Microlink API
- **Framer Motion Animations** — Card slide-in, delete shrink+fade, hover lift
- **Glassmorphism Design** — Dark theme with violet/cyan/pink palette
- **Skeleton Loaders** — Shimmer loading states
- **Responsive** — Works on desktop and mobile

---

## Tech Stack

| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Frontend    | Next.js 15 (App Router), React 19      |
| Styling     | Tailwind CSS v4, Framer Motion          |
| Auth        | Supabase Auth (Google OAuth)            |
| Database    | Supabase Postgres + RLS                 |
| Realtime    | Supabase Realtime (Postgres CDC)        |
| AI          | Groq (LLaMA 3.1-8b-instant)            |
| Metadata    | Microlink API                           |
| Deployment  | Vercel                                  |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth Client ID & Secret (from Google Cloud Console)
- [Groq API Key](https://console.groq.com/keys) (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

> **Note:** `GROQ_API_KEY` has no `NEXT_PUBLIC_` prefix — it's server-side only.

### 3. Supabase Setup

1. **Enable Google OAuth** in Supabase Dashboard → Authentication → Providers
2. **Create the bookmarks table** in SQL Editor:

```sql
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  og_image TEXT
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
```

3. **Enable Realtime** on the bookmarks table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
```

4. **Add redirect URI** in Google Cloud Console:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How AI Works

### Auto-Summary & Tags

When you paste a URL in the add bookmark form:

1. **Microlink API** fetches page metadata (title, description, OG image)
2. **Groq AI** (LLaMA 3.1) analyzes the metadata and generates:
   - 1-line summary
   - 2-4 relevant tags
   - Category classification
3. Results appear in a preview card before you save

### Smart Search

Type natural language queries like:
- *"show my AI learning bookmarks"*
- *"react documentation links"*
- *"videos about system design"*

Groq converts your query into structured search filters that match across titles, URLs, summaries, and tags.

---

## Problems Faced & Solutions

### 1. Supabase Auth + Next.js Server Components
**Problem:** Cookie-based session management works differently across Server Components, Client Components, and Middleware.

**Solution:** Used `@supabase/ssr` with separate client utilities for server, browser, and middleware contexts.

### 2. Middleware Edge Runtime
**Problem:** Next.js middleware runs on Edge Runtime without full Node.js API support.

**Solution:** `@supabase/ssr` is fully Edge-compatible. Middleware only handles session refresh and route protection.

### 3. Real-time + Row Level Security
**Problem:** DELETE events don't include full row data (only `payload.old.id`).

**Solution:** Filter INSERT events by `user_id`. Match DELETE events by `id` from `payload.old`.

### 4. OAuth Redirect Flow
**Problem:** After Google sign-in, the user needs a valid session redirect.

**Solution:** Created `/auth/callback` route that calls `exchangeCodeForSession()`.

### 5. Realtime Race Condition (Optimistic Updates)
**Problem:** Newly added bookmarks sometimes didn't appear on the originating tab.

**Root Cause:** Relying solely on Realtime subscription caused a timing race between the INSERT response and the WebSocket event.

**Solution:** Implemented optimistic updates — after `.insert().select().single()`, the returned bookmark is immediately added to local state. Realtime subscription deduplicates by `id`.

### 6. Groq API Key Security
**Problem:** AI features need an API key, but exposing it client-side is a security risk.

**Solution:** Created Next.js API routes (`/api/ai/summarize`, `/api/ai/search`) that run server-side. The `GROQ_API_KEY` env var has no `NEXT_PUBLIC_` prefix so it's never bundled into client code.

---

## Project Structure

```
src/
├── app/
│   ├── api/ai/
│   │   ├── summarize/route.ts   # AI summary + tags (Groq + Microlink)
│   │   └── search/route.ts      # Natural language search (Groq)
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── bookmarks/page.tsx        # Main bookmarks page (protected)
│   ├── login/page.tsx            # Animated login page
│   ├── page.tsx                  # Root redirect
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Design system + animations
├── components/
│   ├── AddBookmarkForm.tsx       # Form with AI preview
│   ├── BookmarkCard.tsx          # Card with thumbnail + tags + animations
│   ├── BookmarkList.tsx          # Grid + AnimatePresence + search
│   ├── Navbar.tsx                # Glass navbar with AI badge
│   ├── SearchBar.tsx             # AI-powered search
│   └── SkeletonCard.tsx          # Shimmer loading state
├── lib/supabase/
│   ├── client.ts                 # Browser Supabase client
│   ├── server.ts                 # Server Supabase client
│   └── middleware.ts             # Middleware Supabase client
└── middleware.ts                 # Next.js middleware
```

---

## License

MIT
