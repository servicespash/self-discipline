# Security Audit Plan: Supabase Data Sovereignty & Multi-Seat Licensing

## 1. Executive Summary
This document establishes the security audit plan for the Cymatic Discipline OS Supabase backend migration. It addresses strict data sovereignty, privacy guarantees for private spiritual tracking data, Row-Level Security (RLS) enforcement, multi-seat licensing isolation, and real-time session synchronization.

---

## 2. Threat Model & Security Objectives
- **Data Sovereignty & Privacy**: Private spiritual discipline logs, meditation streaks, and personal devotional data must remain strictly isolated to the authenticated user. No cross-tenant leakage is permissible under any circumstance.
- **Multi-Seat Licensing Integrity**: Team and Enterprise license owners control seat allocation. Only authorized seat members linked via cryptographic license keys or assigned team emails may access enterprise-tier capabilities.
- **Reseller Commission Security**: Referral signups and commission calculations ($0.50 base commission, $1.00 silent tier trigger after 10 verified signups) must be protected against tampering, replay attacks, and unauthorized privilege escalation.
- **Authentication Resilience**: Seamless session synchronization between Supabase Auth state changes and application context.

---

## 3. Row-Level Security (RLS) Architecture & Policies

### 3.1. Users Table (`public.users`)
- **Objective**: Restrict user record modifications to the profile owner or root administrators, while allowing authenticated lookup for team management.
- **RLS Policies**:
  - `SELECT`: Allow authenticated users to view profiles within their organization or team.
  - `UPDATE`: Allow users to update only their own record (`auth.uid() = uid` or matching `email`).

### 3.2. Spiritual Discipline Streaks & Logs (`public.spiritual_streaks`, `public.spiritual_logs`)
- **Objective**: Absolute privacy for private spiritual tracking data.
- **RLS Policies**:
  - `ALL`: Users can only read, write, and delete their own spiritual discipline records (`user_uid = auth.uid()` or matching authenticated session identifier).
  - Explicit denial for public or cross-tenant access.

### 3.3. Task Management (`public.tasks`)
- **Objective**: Team and individual task synchronization with strict tenancy boundaries.
- **RLS Policies**:
  - `SELECT`/`INSERT`/`UPDATE`/`DELETE`: Users can manage tasks assigned to them or created within their licensed team workspace.

### 3.4. Multi-Seat Licensing & Team Assignments (`public.licenses`)
- **Objective**: Prevent unauthorized seat expansion and license hijacking.
- **RLS Policies**:
  - `SELECT`: Team members assigned to a license can view license capacity and member lists.
  - `ALL (Owner)`: Only the license owner (`owner_uid`) can modify seat assignments and tier parameters.

---

## 4. Audit Checklist & Verification Procedure
1. **Migration Verification**: Apply `src/db/supabase_migration.sql` to the Supabase instance.
2. **RLS Enforcement Test**: Execute test queries using mock JWT tokens for distinct users to verify that spiritual logs and private task data return empty results when queried across tenants.
3. **Session State Synchronization Test**: Verify that `SessionContext` correctly registers `supabase.auth.onAuthStateChange` events, automatically synchronizing user state, role assignment, and dashboard loading without token staleness.
