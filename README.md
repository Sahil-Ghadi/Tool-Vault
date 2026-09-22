# 🛠 Tool Vault

A personal tool bookmarking app built with Next.js, Supabase, and Tailwind CSS. Save tools you discover so you never forget them — with live website previews, tags, and search.

## Features

- **Save tools** — paste a URL and name, add an optional description and tags
- **Live preview** — see the website in an iframe as you type the URL
- **Card grid** — click any card to toggle a live preview of the site
- **Search** — filter tools by name, URL, or description
- **Tag filtering** — filter by tag with one click
- **Delete** — remove tools you no longer need
- **Persistent** — all tools stored in Supabase Postgres

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (Postgres) |
| Icons | Lucide React |

## Getting Started

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase-schema.sql`](./supabase-schema.sql)

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase project under **Settings → API**.

### 3. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/tools/
│   ├── route.ts          # GET (list) + POST (save) tools
│   └── [id]/route.ts     # DELETE a tool
├── page.tsx              # Main UI
└── layout.tsx
lib/
├── supabase.ts           # Supabase client
└── types.ts              # Tool type definition
supabase-schema.sql       # SQL schema to run in Supabase
```

## Deploying

The easiest way to deploy is [Vercel](https://vercel.com):

1. Push to GitHub (already done ✅)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
4. Deploy
