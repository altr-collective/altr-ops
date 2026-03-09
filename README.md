# ALTR COLLECTIVE — Ops Tool

A task and invoice management tool for the ALTR COLLECTIVE team.
Built with React + Supabase. Deployable on Netlify in ~10 minutes.

---

## Setup in 4 steps

### Step 1 — Create your Supabase database (5 min)

1. Go to **https://supabase.com** and sign up (free)
2. Click **New Project** — name it `altr-ops`, pick a region close to India
3. Once created, go to **SQL Editor** (left sidebar)
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xyz.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2 — Configure environment variables

1. Duplicate `.env.example` and rename it `.env.local`
2. Fill in your values:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

### Step 3 — Deploy to Netlify (5 min)

**Option A — Deploy from GitHub (recommended)**
1. Push this folder to a GitHub repo
2. Go to **https://netlify.com** → New site from Git → pick your repo
3. Build command: `npm run build` | Publish directory: `build`
4. Go to **Site settings → Environment variables** and add:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Trigger a redeploy — your site is live at `https://yoursite.netlify.app`

**Option B — Drag and drop**
1. Run `npm install && npm run build` locally
2. Go to **https://netlify.com** → drag the `build/` folder onto the deploy zone
3. Add environment variables in site settings and redeploy

### Step 4 — Share with your team

Send your team the Netlify URL. Everyone who opens it shares the same live database — no login required.

---

## Local development

```bash
npm install
npm start
```
Opens at http://localhost:3000

---

## Project structure

```
src/
  lib/
    supabase.js     — Supabase client + CRUD helpers
    utils.js        — Design tokens, formatters, utilities
  components/
    UI.js           — All shared components (Button, Modal, etc.)
  pages/
    Dashboard.js
    ClientsTeamProjects.js
    TimeLogInvoice.js
  App.js            — Root app, data fetching, routing
supabase-schema.sql — Run this in Supabase SQL editor
netlify.toml        — Netlify deployment config
```

---

## How it works

- **Clients** — add clients with default rates and payment terms
- **Team** — add members with roles and default rates; set per-client rate overrides
- **Projects** — create hourly or fixed projects per client
- **Time Log** — any team member logs hours against a project (member + project + date + hours)
- **Invoice** — select client + project; for hourly projects, unbilled hours auto-populate as line items grouped by team member with their per-client rate applied; saving marks those hours as billed

All data lives in Supabase — shared and real-time across all devices.
