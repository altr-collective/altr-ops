# ALTR COLLECTIVE — Ops Tool

Internal task and invoice management tool for the ALTR Collective team.
Built with React + Supabase. Auth secured with role-based access.

---

## Setup — 3 steps

### Step 1 — Database (run once in Supabase SQL Editor)

Run these two files in order:
1. `supabase-schema.sql` — creates tables
2. `supabase-auth-schema.sql` — adds auth, profiles, and secure RLS policies

### Step 2 — Enable Supabase Auth

1. Supabase Dashboard → **Authentication → Providers**
2. Confirm **Email** is enabled (it is by default)
3. Go to **Authentication → Users → Add User**
4. Create accounts for each team member

### Step 3 — Set admin role

After creating users, set admin roles in SQL Editor:

```sql
-- Make a user admin (replace with their email)
UPDATE profiles SET role = 'admin' WHERE email = 'bhoomi@altrcollective.io';
UPDATE profiles SET role = 'admin' WHERE email = 'amreen@altrcollective.io';

-- Everyone else is 'member' by default
```

### Step 4 — Deploy to Netlify

Push to GitHub → Netlify auto-deploys. No environment variables needed —
credentials are baked in.

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Everything — clients, team, projects, invoices, financials |
| **Member** | Log time only + see their own entries |

---

## How to add a team member

1. Supabase Dashboard → Authentication → Users → Add User
2. Enter their email + a temporary password
3. Ask them to log in and change their password
4. To make them admin: run `UPDATE profiles SET role = 'admin' WHERE email = '...'`

---

## Local development

```bash
npm install
npm start
```
