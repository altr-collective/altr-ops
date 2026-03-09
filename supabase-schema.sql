-- ============================================================
-- ALTR COLLECTIVE — OPS TOOL DATABASE SCHEMA
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- CLIENTS
create table if not exists clients (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  email         text,
  default_rate  numeric,
  terms         text default 'Net 30',
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- TEAM MEMBERS
create table if not exists team (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  role          text,
  default_rate  numeric,
  rates         jsonb default '{}',   -- { client_id: rate, ... }
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- PROJECTS
create table if not exists projects (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  client_id     text references clients(id) on delete cascade,
  type          text default 'hourly',   -- 'hourly' | 'fixed'
  status        text default 'active',   -- 'active' | 'completed' | 'archived'
  amount        numeric,                 -- for fixed projects
  description   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- TIME LOGS
create table if not exists logs (
  id            text primary key default gen_random_uuid()::text,
  member_id     text references team(id) on delete set null,
  project_id    text references projects(id) on delete cascade,
  date          date not null,
  hours         numeric not null,
  notes         text,
  billed        boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- INVOICES
create table if not exists invoices (
  id            text primary key default gen_random_uuid()::text,
  client_id     text references clients(id) on delete set null,
  client_name   text,
  project_id    text references projects(id) on delete set null,
  project_name  text,
  no            text,
  date          date,
  terms         text,
  subtotal      numeric,
  gst           boolean default false,
  gst_rate      numeric default 0,
  total         numeric,
  status        text default 'unpaid',  -- 'unpaid' | 'paid' | 'overdue'
  line_items    jsonb default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Enable Row Level Security (open policy for team use) ──────────
alter table clients  enable row level security;
alter table team     enable row level security;
alter table projects enable row level security;
alter table logs     enable row level security;
alter table invoices enable row level security;

-- Allow all operations for anonymous users (anyone with the app URL)
-- For added security later, replace with auth-based policies
create policy "allow_all_clients"  on clients  for all using (true) with check (true);
create policy "allow_all_team"     on team     for all using (true) with check (true);
create policy "allow_all_projects" on projects for all using (true) with check (true);
create policy "allow_all_logs"     on logs     for all using (true) with check (true);
create policy "allow_all_invoices" on invoices for all using (true) with check (true);
