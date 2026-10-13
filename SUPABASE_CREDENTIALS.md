# Supabase Backend & Credentials Memory File

## 1. Project Configuration & Connection Details
- **Supabase Project ID**: `sutaensdqobetxldxatd`
- **Supabase Project URL**: `https://sutaensdqobetxldxatd.supabase.co`
- **Supabase Publishable / Anon Key**: `sb_publishable_-Iii34MXCXQKTMo-fXfU1g_Lieei1eV`
- **Database Connection**: PostgreSQL (Managed via Supabase Cloud)
- **Database Password**: Configured securely in runtime environment secrets (`SUPABASE_DB_PASSWORD`).

## 2. Single Source of Truth Architecture
- **Authentication Gate**: Robust email-based sign-in and sign-up with cryptographic user ID hashing and real-time Supabase Auth (`supabase.auth`) state change synchronization (`SessionContext.tsx`).
- **Data Persistence**: All user profiles, licensing seats, referral codes, spiritual discipline logs, and task registries are stored exclusively in Supabase tables (`public.users`, `public.licenses`, `public.app_settings`, `public.tasks`, `public.spiritual_streaks`, `public.spiritual_logs`, `public.reseller_commissions`).
- **Migrations**: Synced via `src/db/supabase_migration.sql` and managed through Drizzle ORM (`src/db/schema.ts`, `src/db/drizzle.config.ts`).

## 3. Row-Level Security (RLS) & Data Sovereignty
- Strict isolation enforced on all tables (`public.users`, `public.spiritual_streaks`, `public.spiritual_logs`, `public.tasks`).
- Users can only read and write their own rows (`auth.uid() = uid` or tenant license matching).
- Enterprise tiers and referral commissions operate under transactional isolation.
