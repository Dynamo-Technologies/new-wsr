# Dynamo WSR Platform — Deployment Guide

## Prerequisites

- EC2 instance (t3.large recommended, Amazon Linux 2 or Ubuntu 22.04)
- Node.js 20+ installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed
- Supabase project set up
- Azure AD application registered

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your Project URL and Anon Key

### Run Schema
1. Go to Supabase Dashboard → SQL Editor
2. Paste and run `supabase/migrations/001_initial_schema.sql`

### Enable pgvector
The migration handles this, but verify: SQL Editor → `SELECT * FROM pg_extension WHERE extname = 'vector';`

### Configure Azure AD OAuth
1. Supabase Dashboard → Authentication → Providers → Azure
2. Enable Azure
3. Set Client ID, Client Secret, and Tenant ID from your Azure App Registration
4. Add redirect URL: `https://your-domain.com/auth/callback`

### Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy generate-embeddings
supabase functions deploy generate-msr-summary
supabase functions deploy generate-quarterly-review
supabase functions deploy generate-past-performance
supabase functions deploy lattice-sync

# Set Edge Function secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set LATTICE_API_KEY=lat_...
supabase secrets set LATTICE_API_URL=https://api.latticehq.com/v1
```

### Schedule Lattice Sync (Weekly)
In Supabase Dashboard → Database → Cron Jobs:
```sql
SELECT cron.schedule(
    'lattice-weekly-sync',
    '0 0 * * 0',  -- Every Sunday at midnight
    $$SELECT net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/lattice-sync',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    )$$
);
```

---

## 2. Azure AD App Registration

1. Azure Portal → App Registrations → New Registration
2. Name: `Dynamo WSR Platform`
3. Redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. API permissions: `openid`, `profile`, `email`, `offline_access`
5. Note Client ID, create Client Secret, note Tenant ID
6. Add these to Supabase Auth → Azure provider

---

## 3. EC2 Deployment

### Server Setup (Ubuntu 22.04)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Create app directory
sudo mkdir -p /opt/dynamo-wsr
sudo chown $USER:$USER /opt/dynamo-wsr
```

### Deploy Application
```bash
# Clone/copy the project to the server
cd /opt/dynamo-wsr

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your actual values:
nano .env

# Build the application
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 config and enable on startup
pm2 save
pm2 startup
# Follow the printed command to enable startup
```

### Nginx Setup
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/dynamo-wsr
sudo ln -s /etc/nginx/sites-available/dynamo-wsr /etc/nginx/sites-enabled/

# Get SSL certificate (replace domain)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wsr.dynamobigdata.com

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Environment Variables (.env)

```bash
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
NODE_ENV=production
```

---

## 5. Ongoing Operations

### Update Application
```bash
cd /opt/dynamo-wsr
git pull  # or copy new files
npm install
npm run build
pm2 restart dynamo-wsr
```

### View Logs
```bash
pm2 logs dynamo-wsr
pm2 logs dynamo-wsr --lines 100
```

### Monitor
```bash
pm2 status
pm2 monit
```

### Backup Database
Use Supabase Dashboard → Settings → Database → Backups (automatic)
Or use `pg_dump` with the connection string from Supabase settings.

---

## 6. First Admin User

1. Sign in via Azure AD
2. In Supabase SQL Editor, promote your account to admin:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your.email@dynamobigdata.com';
```

3. Now you can use the Admin Panel to set up projects, tags, and other users.

---

## Architecture Notes

- SvelteKit serves both SSR and API routes via the Node adapter
- Supabase handles auth, database, and Edge Functions
- All AI operations are async via Edge Functions (Claude API)
- pgvector enables semantic search for past performance queries
- Lattice sync runs weekly to keep org chart current
- RLS policies enforce data access controls at the database level
