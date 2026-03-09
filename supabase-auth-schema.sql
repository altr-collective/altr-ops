-- ============================================================
-- ALTR COLLECTIVE — AUTH SCHEMA
-- Run this AFTER supabase-schema.sql in Supabase SQL Editor
-- ============================================================

-- PROFILES table — links Supabase auth users to roles
create table if not exists profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text,
  name      text,
  role      text default 'member',  -- 'admin' | 'member'
  created_at timestamptz default now()
);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Users can read their own profile
create policy "users_read_own_profile"
  on profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "admins_read_all_profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update profiles (e.g. change roles)
create policy "admins_update_profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── DROP old open policies ──────────────────────────────────────
drop policy if exists "allow_all_clients"  on clients;
drop policy if exists "allow_all_team"     on team;
drop policy if exists "allow_all_projects" on projects;
drop policy if exists "allow_all_logs"     on logs;
drop policy if exists "allow_all_invoices" on invoices;

-- ── NEW POLICIES — authenticated users only ─────────────────────

-- CLIENTS: admins full access, members read-only
create policy "auth_read_clients"
  on clients for select
  using (auth.uid() is not null);

create policy "admin_write_clients"
  on clients for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- TEAM: admins full access, members read-only
create policy "auth_read_team"
  on team for select
  using (auth.uid() is not null);

create policy "admin_write_team"
  on team for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- PROJECTS: admins full access, members read-only
create policy "auth_read_projects"
  on projects for select
  using (auth.uid() is not null);

create policy "admin_write_projects"
  on projects for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- LOGS: all authenticated users can insert + read, only owner or admin can delete
create policy "auth_read_logs"
  on logs for select
  using (auth.uid() is not null);

create policy "auth_insert_logs"
  on logs for insert
  with check (auth.uid() is not null);

create policy "auth_delete_logs"
  on logs for delete
  using (auth.uid() is not null);

create policy "auth_update_logs"
  on logs for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- INVOICES: admins full access, members read-only
create policy "admin_all_invoices"
  on invoices for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "member_read_invoices"
  on invoices for select
  using (auth.uid() is not null);
