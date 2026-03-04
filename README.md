# Dynamo WSR Platform

Internal weekly status report management platform for Dynamo, a 350-person federal contracting team. Employees submit WSRs, managers generate AI-powered monthly summaries, and BD teams search past work for proposal narratives.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 2 + Svelte 4 + TypeScript |
| Styling | Tailwind CSS 3 (light/dark mode) |
| Backend | Supabase (PostgreSQL + pgvector, Auth) |
| Auth | Azure AD (Entra ID) OAuth via Supabase |
| AI | AWS Bedrock — Claude Haiku 4.5 (summaries + narratives) |
| Deployment | Docker + Nginx (or EC2 + PM2) |

## Features

- **Weekly Status Reports** — employees submit WSRs with accomplishments, blockers, next week plans, hours narrative, and work type tags
- **Manager Dashboard** — view team WSRs with filters by member and week
- **AI Monthly Status Reports** — generate consolidated monthly summaries from team WSRs via Claude, edit and finalize, export as Markdown or PDF
- **Past Performance Search** — search WSRs by project, date range, tags, and keyword; generate proposal-ready narratives via AI with PDF export
- **Admin Panel** — manage projects and users, role-based access control
- **Dark Mode** — user-selectable with localStorage persistence
- **Demo Mode** — full offline demo with realistic data (no Supabase required)

## Project Structure

```
src/
├── hooks.server.ts              # SSR auth guard + Supabase client
├── lib/
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar
│   │   ├── ui/                  # Modal, Spinner, TagInput, Toast, etc.
│   │   └── wsr/                 # WSRCard
│   ├── server/
│   │   └── bedrock.ts           # AWS Bedrock client (MSR + past perf)
│   ├── stores/                  # auth, theme, toast
│   ├── utils/
│   │   ├── dates.ts             # Date helpers (date-fns)
│   │   └── export.ts            # Markdown/PDF export
│   ├── demo/                    # Demo mode data
│   ├── config.ts                # Admin email list
│   ├── supabase.ts              # Browser + server client factories
│   └── types.ts                 # TypeScript interfaces
├── routes/
│   ├── login/                   # Azure AD sign-in
│   ├── auth/callback/           # OAuth callback
│   ├── auth/signout/            # Sign out
│   └── (app)/
│       ├── +layout.svelte       # App shell with sidebar
│       ├── dashboard/           # Employee home + WSR list
│       │   └── wsr/
│       │       ├── new/         # Create WSR form
│       │       └── [id]/        # View/edit WSR
│       ├── manager/             # Team WSRs + MSR generation
│       ├── bd/                  # Past performance search + narrative
│       └── admin/               # Project + user management
└── app.css                      # Tailwind + custom component classes

supabase/
└── migrations/                  # Full schema with RLS policies
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project with Azure AD OAuth configured
- AWS IAM credentials with `AmazonBedrockFullAccess` policy (for AI features)

### Install & Run

```bash
npm install
npm run dev
```

The app starts in **demo mode** by default when no Supabase credentials are configured.

Open [http://localhost:5173](http://localhost:5173).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Run svelte-check type validation |

## Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AWS Bedrock (for AI features)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Production
PORT=3000
NODE_ENV=production
```

Azure AD OAuth is configured in the Supabase Dashboard under Authentication > Providers.

## Database Setup

1. Run the schema migration in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`

2. Create the monthly status reports table:

```sql
CREATE TABLE IF NOT EXISTS public.monthly_status_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  month DATE NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  ai_summary TEXT,
  human_edited_summary TEXT,
  wsr_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, month)
);

ALTER TABLE public.monthly_status_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read MSRs"
  ON public.monthly_status_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert MSRs"
  ON public.monthly_status_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update MSRs"
  ON public.monthly_status_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

## User Roles

| Role | Dashboard | Submit WSR | Manager View | BD Search | Admin |
|------|-----------|-----------|--------------|-----------|-------|
| Employee | Yes | Yes | No | No | No |
| PM (by project) | Yes | Yes | Own projects | Own projects | No |
| Admin | Yes | Yes | All projects | All projects | Yes |

PMs are identified by matching `pm_email` on the `projects` table. Admins have `role = 'admin'` or their email is in the `ADMIN_EMAILS` list in `src/lib/config.ts`.

### First Admin

After signing in via Azure AD, promote your account in Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your.email@dynamobigdata.com';
```

## AI Features

Both features use **AWS Bedrock** with **Claude Haiku 4.5** (`us.anthropic.claude-haiku-4-5-20251001-v1:0`), implemented in `src/lib/server/bedrock.ts`:

**Monthly Status Reports (MSR)**
- Aggregates a month of WSRs for a project
- Generates: Executive Summary, Key Accomplishments, Ongoing Work, Blockers & Risks, Next Month Outlook
- Saved to database, editable, exportable as Markdown or PDF

**Past Performance Narrative**
- Takes selected WSRs from search results
- Generates: Project Overview, Technical Approach, Key Accomplishments, Challenges Overcome, Relevance to Future Work
- Written in third person, suitable for government proposals
- Export as Markdown or PDF

Credentials are read from `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars, with fallback to EC2 instance role in production.

## Database

PostgreSQL via Supabase with:

- **pgvector** — 1536-dimension embeddings on WSRs for semantic search (IVFFlat index, cosine distance)
- **RLS** — Row-level security policies enforce access control at the database level
- **Helper functions** — `is_manager_of()`, `get_team_ids()`, `search_wsrs_by_embedding()`
- **33 work type tags** seeded across technical, administrative, and specialized categories

## Deployment

### Docker (Recommended)

```bash
docker compose build
docker compose up -d
```

The compose stack runs:
- **app** — SvelteKit Node server (port 3000, internal)
- **nginx** — Reverse proxy with gzip, caching, and SSL (port 80/443)

The `ORIGIN` env var in `docker-compose.yml` must match the URL users access the app from (required for SvelteKit CSRF protection).

For production with Supabase:

```bash
docker compose build \
  --build-arg PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Manual (EC2 + PM2)

See [DEPLOY.md](DEPLOY.md) for full instructions.

## Brand

- **Primary color:** Dynamo Red `#fe4e51`
- **Dark mode:** Dynamo Black `#343433`
- **Font:** Inter
