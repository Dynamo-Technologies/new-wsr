# Dynamo WSR Platform

Weekly Status Report management system for a 350-person federal contracting team. Built with SvelteKit, Supabase, and AI-powered summaries.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 2 + Svelte 4 + TypeScript |
| Styling | Tailwind CSS 3 (light/dark mode) |
| Backend | Supabase (Postgres + pgvector, Auth, Edge Functions) |
| Auth | Azure AD (Entra ID) OAuth via Supabase |
| AI | Anthropic Claude via AWS Bedrock (summaries + embeddings) |
| Deployment | Docker + Nginx (or EC2 + PM2) |

## Features

- **Weekly Status Reports** — employees submit WSRs with accomplishments, blockers, and work type tags
- **Manager Dashboard** — view team WSRs, generate AI-powered monthly status reports, run quarterly reviews
- **Past Performance Search** — semantic search across historical WSRs for BD proposals
- **Admin Panel** — manage projects, users, tags, manager overrides, and Lattice org sync
- **Dark Mode** — user-selectable with localStorage persistence, custom Dynamo Black (`#343433`) color scale
- **Demo Mode** — full offline demo with realistic data (no Supabase required)

## Project Structure

```
src/
├── lib/
│   ├── components/       # UI, layout, and WSR components
│   ├── demo/             # Demo mode data
│   ├── stores/           # Svelte stores (toast, theme)
│   ├── utils/            # Date helpers, export utilities
│   ├── supabase.ts       # Browser + server client factory
│   └── types.ts          # All TypeScript interfaces
├── routes/
│   ├── login/            # Azure AD login page
│   ├── auth/callback/    # OAuth callback
│   └── (app)/
│       ├── dashboard/    # Employee dashboard + WSR CRUD
│       ├── manager/      # Team view, MSR generation, quarterly reviews
│       ├── bd/           # Past performance semantic search
│       └── admin/        # Projects, users, tags, overrides, Lattice
├── hooks.server.ts       # SSR auth guard + demo mode
└── app.html

supabase/
├── migrations/           # Full schema with RLS policies
└── functions/            # Deno edge functions
    ├── generate-embeddings/
    ├── generate-msr-summary/
    ├── generate-quarterly-review/
    ├── generate-past-performance/
    └── lattice-sync/
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

The app starts in **demo mode** by default when no Supabase credentials are configured. Log in with:

- **Email:** `admin.one@dynamo.works`
- **Password:** `password`

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

# Production
PORT=3000
NODE_ENV=production
```

Edge function secrets are set in the Supabase Dashboard:

- `ANTHROPIC_API_KEY` — Claude API for summaries and embeddings (or AWS Bedrock credentials)
- `LATTICE_API_KEY` — Lattice API for org chart sync

Azure AD OAuth is configured in the Supabase Dashboard under Authentication > Providers.

## User Roles

| Role | Access |
|------|--------|
| Employee | Personal dashboard, submit WSRs |
| Manager | Team WSRs, generate MSRs, quarterly reviews |
| Director / VP | Same as manager with broader team visibility |
| Admin | All of the above + admin panel, past performance search |

## Deployment

### Docker (Recommended)

```bash
docker compose build
docker compose up -d
```

The app will be available at `http://localhost`. The compose stack runs:
- **app** — SvelteKit Node server (port 3000, internal)
- **nginx** — Reverse proxy with gzip and caching (port 80, exposed)

To stop:

```bash
docker compose down
```

### Manual (EC2 + PM2)

See [DEPLOY.md](DEPLOY.md) for EC2 + Nginx + PM2 deployment instructions.

## Brand

- **Primary color:** Dynamo Red `#fe4e51`
- **Dark mode:** Dynamo Black `#343433` (custom Tailwind color scale)
- **Favicon:** `DYNAMO-ICON-RED.png`
- **Font:** Inter
