/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Universal Institutional Governance & Consent Migration Schema
 */

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Trigger Function for Auto-Updating Timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 3. Universal Users Table (Institutional Registry & Dynamic Roles)
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  uid text unique not null,
  email text unique not null,
  moniker text,
  role text default 'member' check (role in ('member', 'student', 'athlete', 'guardian', 'trainer', 'coach', 'admin', 'administrator', 'reseller')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Governance & Consent Contracts (Prevents Malicious Lockdowns)
create table if not exists public.governance_contracts (
  id uuid default uuid_generate_v4() primary key,
  admin_uid text not null references public.users(uid) on delete cascade,
  member_uid text not null references public.users(uid) on delete cascade,
  institution_type text default 'sports_team' check (institution_type in ('sports_team', 'educational', 'corporate', 'family')),
  contract_title text not null,
  agreed_packages jsonb default '[]'::jsonb,
  agreed_time_windows jsonb default '[]'::jsonb,
  status text default 'draft' check (status in ('draft', 'pending_member_approval', 'negotiating', 'active', 'revoked')),
  member_declined_rules jsonb default '[]'::jsonb,
  party_suggestions jsonb default '[]'::jsonb,
  block_nudity boolean default true not null,
  signed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (admin_uid, member_uid)
);

create trigger set_governance_contracts_updated_at
  before update on public.governance_contracts
  for each row execute function public.handle_updated_at();

-- 5. Governance Audit & Violation Reports Table
create table if not exists public.governance_reports (
  id uuid default uuid_generate_v4() primary key,
  contract_id uuid references public.governance_contracts(id) on delete cascade,
  reporter_uid text not null references public.users(uid) on delete cascade,
  reported_admin_uid text not null references public.users(uid) on delete cascade,
  violation_type text default 'unauthorized_trigger' check (violation_type in ('unauthorized_trigger', 'out_of_agreed_hours', 'malicious_intent', 'unacceptable_rule')),
  details text not null,
  status text default 'pending_review' check (status in ('pending_review', 'investigating', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Licenses Table
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
  status text default 'Active' check (status in ('Active', 'Exhausted', 'Revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. App Settings & Local Device Authority
create table if not exists public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  user_uid text unique not null references public.users(uid) on delete cascade,
  allowed_apps jsonb default '[]'::jsonb,
  lockdown_settings jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Execution Tasks Table
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

-- 9. Spiritual & Personal Discipline Logs
create table if not exists public.spiritual_streaks (
  id uuid default uuid_generate_v4() primary key,
  user_uid text not null references public.users(uid) on delete cascade,
  discipline_name text not null,
  current_streak integer default 0 not null,
  best_streak integer default 0 not null,
  last_logged_date date,
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

-- 10. Reseller Commissions & Financial Transactions
create table if not exists public.reseller_commissions (
  id uuid default uuid_generate_v4() primary key,
  reseller_uid text not null references public.users(uid) on delete cascade,
  referred_user_uid text not null,
  commission_amount decimal(10, 2) default 0.50 not null,
  status text default 'Pending' check (status in ('Pending', 'Paid', 'Triggered')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_uid text not null references public.users(uid) on delete cascade,
  amount decimal(12, 2) not null,
  type text not null,
  category text not null,
  note text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Hardened Row Level Security (RLS) Policies
alter table public.users enable row level security;
alter table public.governance_contracts enable row level security;
alter table public.governance_reports enable row level security;
alter table public.licenses enable row level security;
alter table public.app_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.spiritual_streaks enable row level security;
alter table public.spiritual_logs enable row level security;
alter table public.reseller_commissions enable row level security;
alter table public.wallet_transactions enable row level security;

-- Policies for Governance Contracts
create policy "Admins and members can access their mutual contract" on public.governance_contracts
  for all using (auth.uid()::text = admin_uid or auth.uid()::text = member_uid);

-- Policies for Governance Reports
create policy "Members can submit reports, admins can view reports against them" on public.governance_reports
  for all using (auth.uid()::text = reporter_uid or auth.uid()::text = reported_admin_uid);

-- User Policies
create policy "Users can read/update own profile" on public.users 
  for all using (auth.uid()::text = uid);

-- Task Policies
create policy "Users manage own tasks" on public.tasks 
  for all using (auth.uid()::text = user_uid);

-- App Settings Policies
create policy "Users manage own settings" on public.app_settings 
  for all using (auth.uid()::text = user_uid);

-- Spiritual Data Policies
create policy "Users manage own streaks" on public.spiritual_streaks 
  for all using (auth.uid()::text = user_uid);
create policy "Users manage own logs" on public.spiritual_logs 
  for all using (auth.uid()::text = user_uid);

-- Wallet Policies
create policy "Users manage own wallet" on public.wallet_transactions 
  for all using (auth.uid()::text = user_uid);

-- 12. Real-Time Telemetry Publications Setup
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.users, 
    public.governance_contracts,
    public.governance_reports,
    public.licenses, 
    public.app_settings, 
    public.tasks, 
    public.spiritual_streaks, 
    public.spiritual_logs, 
    public.reseller_commissions, 
    public.wallet_transactions;
commit;
