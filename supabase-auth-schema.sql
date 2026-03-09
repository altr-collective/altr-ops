-- ============================================================
-- ALTR COLLECTIVE — AUTH SCHEMA
-- Safe to run multiple times (all drops are idempotent)
-- ============================================================

-- PROFILES table
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  role       text default 'member',
  created_at timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS on profiles
alter table profiles enable row level security;

drop policy if exists "users_read_own_profile"    on profiles;
drop policy if exists "admins_read_all_profiles"  on profiles;
drop policy if exists "admins_update_profiles"    on profiles;

create policy "users_read_own_profile"
  on profiles for select using (auth.uid() = id);

create policy "admins_read_all_profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admins_update_profiles"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Drop ALL old policies (open + any previous auth run) ──────
drop policy if exists "allow_all_clients"   on clients;
drop policy if exists "allow_all_team"      on team;
drop policy if exists "allow_all_projects"  on projects;
drop policy if exists "allow_all_logs"      on logs;
drop policy if exists "allow_all_invoices"  on invoices;

drop policy if exists "auth_read_clients"   on clients;
drop policy if exists "admin_write_clients" on clients;

drop policy if exists "auth_read_team"      on team;
drop policy if exists "admin_write_team"    on team;

drop policy if exists "auth_read_projects"  on projects;
drop policy if exists "admin_write_projects" on projects;

drop policy if exists "auth_read_logs"      on logs;
drop policy if exists "auth_insert_logs"    on logs;
drop policy if exists "auth_delete_logs"    on logs;
drop policy if exists "auth_update_logs"    on logs;

drop policy if exists "admin_all_invoices"  on invoices;
drop policy if exists "member_read_invoices" on invoices;

-- ── New secure policies ───────────────────────────────────────

-- CLIENTS: all authenticated users read, admins write
create policy "auth_read_clients" on clients for select
  using (auth.uid() is not null);
create policy "admin_write_clients" on clients for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- TEAM: all authenticated users read, admins write
create policy "auth_read_team" on team for select
  using (auth.uid() is not null);
create policy "admin_write_team" on team for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- PROJECTS: all authenticated users read, admins write
create policy "auth_read_projects" on projects for select
  using (auth.uid() is not null);
create policy "admin_write_projects" on projects for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- LOGS: all authenticated users can read, insert, update, delete
create policy "auth_read_logs"   on logs for select using (auth.uid() is not null);
create policy "auth_insert_logs" on logs for insert with check (auth.uid() is not null);
create policy "auth_update_logs" on logs for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_delete_logs" on logs for delete using (auth.uid() is not null);

-- INVOICES: admins full access, members read-only
create policy "admin_all_invoices" on invoices for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "member_read_invoices" on invoices for select
  using (auth.uid() is not null);
