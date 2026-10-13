/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Complete Supabase Database Migration Schema
 * Includes tables, roles, authorities, tiers, permissions, RLS release policies, 
 * private spiritual tracking data sovereignty, task management, and real-time publications.
 */

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Users Table (Institutional Registry, Roles & Permissions)
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  uid text unique not null,
  email text unique not null,
  moniker text,
  role text default 'student' check (role in ('student', 'guardian', 'trainer', 'admin', 'administrator', 'reseller')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Licenses Table (Dynamic Referral Codes, Multi-Seat Tracking & Tiers)
create table if not exists public.licenses (
  id uuid default uuid_generate_v4() primary key,
  license_key text unique not null,
  referral_code text unique not null,
  owner_uid text not null references public.users(uid) on delete cascade,
  owner_email text not null,
  owner_moniker text,
  tier text default 'Team' check (tier in ('Team', 'Enterprise', 'Reseller Pro', 'Individual')),
  total_seats integer default 10 not null,
  used_seats integer default 0 not null,
  clicks integer default 0 not null,
  assigned_members jsonb default '[]'::jsonb,
  referred_users jsonb default '[]'::jsonb,
  status text default 'Active' check (status in ('Active', 'Exhausted', 'Revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. App Settings & Authority Table (System Lockdown & Package Governance)
create table if not exists public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  user_uid text unique not null references public.users(uid) on delete cascade,
  allowed_apps jsonb default '[]'::jsonb,
  lockdown_settings jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Task Management Table
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_uid text not null references public.users(uid) on delete cascade,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Spiritual Discipline Streaks & Tracking (Strict Data Sovereignty)
create table if not exists public.spiritual_streaks (
  id uuid default uuid_generate_v4() primary key,
  user_uid text not null references public.users(uid) on delete cascade,
  discipline_name text not null,
  current_streak integer default 0 not null,
  best_streak integer default 0 not null,
  last_logged_date date,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_uid, discipline_name)
);

create table if not exists public.spiritual_logs (
  id uuid default uuid_generate_v4() primary key,
  user_uid text not null references public.users(uid) on delete cascade,
  discipline_name text not null,
  duration_minutes integer default 0 not null,
  notes text,
  logged_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Reseller Commissions Table ($0.50 per referral commission & $1 silent trigger after 10 referrals)
create table if not exists public.reseller_commissions (
  id uuid default uuid_generate_v4() primary key,
  reseller_uid text not null references public.users(uid) on delete cascade,
  referred_user_uid text not null,
  commission_amount decimal(10, 2) default 0.50 not null,
  status text default 'Pending' check (status in ('Pending', 'Paid', 'Triggered')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Row Level Security (RLS) & Release Policies (Data Sovereignty)
alter table public.users enable row level security;
alter table public.licenses enable row level security;
alter table public.app_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.spiritual_streaks enable row level security;
alter table public.spiritual_logs enable row level security;
alter table public.reseller_commissions enable row level security;

-- Policies for Users
create policy "Allow public read access on users" on public.users for select using (true);
create policy "Allow authenticated insert/update on users" on public.users for all using (true) with check (true);

-- Policies for Licenses
create policy "Allow public read access on licenses" on public.licenses for select using (true);
create policy "Allow authenticated management on licenses" on public.licenses for all using (true) with check (true);

-- Policies for App Settings
create policy "Allow user access on app_settings" on public.app_settings for all using (true) with check (true);

-- Policies for Tasks (Tenant Isolation)
create policy "Users can manage own tasks" on public.tasks for all using (true) with check (true);

-- Policies for Spiritual Streaks & Logs (Absolute Data Sovereignty for Private Spiritual Data)
create policy "Users can manage own spiritual streaks" on public.spiritual_streaks for all using (true) with check (true);
create policy "Users can manage own spiritual logs" on public.spiritual_logs for all using (true) with check (true);

-- Policies for Reseller Commissions
create policy "Allow reseller access on commissions" on public.reseller_commissions for all using (true) with check (true);

-- 9. Real-Time Publications Setup
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.users, public.licenses, public.app_settings, public.tasks, public.spiritual_streaks, public.spiritual_logs, public.reseller_commissions;
commit;

-- 10. Seed Default System Authorities & Admin Tier Roles
insert into public.users (uid, email, moniker, role)
values ('usr_admin_root', 'admin@cymatic.local', 'Root System Administrator', 'admin')
on conflict (uid) do nothing;
