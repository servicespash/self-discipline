# Port "Cymatic Discipline OS" from GitHub into this Lovable project

## Goal
Rebuild the cloned repo (servicespash/self-discipline — a self-discipline dashboard with tasks, wallet, prayer/Qibla, lockdown, calendar, AI assistant "Rama", profile/licensing) as a Lovable app. The original uses React Router + Express + Supabase + Gemini; Lovable uses TanStack Start + Lovable Cloud + Lovable AI Gateway, so code is adapted, not copied verbatim.

## Scope

### 1. Backend (Lovable Cloud)
- Enable Lovable Cloud (database + auth + storage).
- Create tables from the repo's `src/db/supabase_migration.sql` / Drizzle schema: users, licenses, governance_contracts, governance_reports, tasks, wallet transactions, calendar events, etc.
- Row-level security so each user only sees their own data.
- Email/password auth matching the repo's Login + Onboarding flow.

### 2. AI features (Lovable AI Gateway)
- Replace direct Gemini calls (`@google/genai`, Express `server.ts`) with server functions calling the Lovable AI Gateway (Gemini models) — covers the "Rama" assistant, intent parsing, room makeover, speech discipline.

### 3. Screens (ported to TanStack Start routes)
- `/` → redirect to `/dashboard` (or login when signed out)
- `/dashboard` — main dashboard with widgets
- `/tasks` — task manager with rules
- `/calendar` — calendar manager
- `/wallet` — wallet discipline (balance, allocation pillars, transactions)
- `/prayer` — prayer times + Qibla compass
- `/makeover` — room makeover (AI)
- `/settings` — lockdown protocols
- `/apps` — app authority
- `/focus` — focus/VPN manager
- `/wellbeing` — wellbeing hub
- `/profile` — profile, subscription, referral, settings, danger tabs
- Legal pages: `/terms`, `/privacy`, `/trust`, `/author`, `/cloud`
- Shared shell: sidebar + header layout, lockdown overlay, floating "Rama" hub, PWA install banner

### 4. Design system
- Port the repo's theme (`src/styles/ThemeConfig.ts`, `index.css`) into `src/styles.css` as semantic tokens; keep the app's dark "cymatic" aesthetic.

### 5. Deliberately dropped
- Capacitor/Android wrappers, Express server, service-worker PWA internals, drizzle-kit tooling — replaced by Lovable equivalents or out of scope for the web app.

## Phases
1. Enable Lovable Cloud; create schema + auth.
2. Design system tokens + app shell (sidebar/header/layout).
3. Core screens: dashboard, tasks, wallet, calendar, profile.
4. Discipline screens: prayer/Qibla, lockdown, apps, focus, wellbeing.
5. AI features via AI Gateway (Rama hub, makeover, speech).
6. Legal/static pages, referral/licensing logic, final polish + verification.

## Notes
- Some device-level features (real app locking, VPN control) are Android-only in the original; on web they'll be represented as dashboards/simulated controls.
