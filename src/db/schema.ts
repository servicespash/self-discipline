/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Drizzle Database Schema (Universal Governance Contracts)
 */

import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, decimal, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').unique().notNull(),
  email: text('email').unique().notNull(),
  moniker: text('moniker'),
  role: text('role').default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const governanceContracts = pgTable('governance_contracts', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUid: text('admin_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  memberUid: text('member_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  institutionType: text('institution_type').default('sports_team').notNull(),
  contractTitle: text('contract_title').notNull(),
  agreedPackages: jsonb('agreed_packages').default([]),
  agreedTimeWindows: jsonb('agreed_time_windows').default([]),
  status: text('status').default('draft').notNull(), // 'draft', 'pending_member_approval', 'negotiating', 'active', 'revoked'
  memberDeclinedRules: jsonb('member_declined_rules').default([]),
  partySuggestions: jsonb('party_suggestions').default([]),
  blockNudity: boolean('block_nudity').default(true).notNull(),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const governanceReports = pgTable('governance_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  contractId: uuid('contract_id').references(() => governanceContracts.id, { onDelete: 'cascade' }),
  reporterUid: text('reporter_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  reportedAdminUid: text('reported_admin_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  violationType: text('violation_type').default('unauthorized_trigger').notNull(), // 'unauthorized_trigger', 'out_of_agreed_hours', 'malicious_intent', 'unacceptable_rule'
  details: text('details').notNull(),
  status: text('status').default('pending_review').notNull(), // 'pending_review', 'investigating', 'resolved', 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const governanceComments = pgTable('governance_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  contractId: uuid('contract_id').references(() => governanceContracts.id, { onDelete: 'cascade' }),
  senderUid: text('sender_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  senderMoniker: text('sender_moniker').default('Discipline Architect'),
  commentText: text('comment_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const licenses = pgTable('licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  licenseKey: text('license_key').unique().notNull(),
  referralCode: text('referral_code').unique().notNull(),
  ownerUid: text('owner_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  ownerEmail: text('owner_email').notNull(),
  ownerMoniker: text('owner_moniker'),
  tier: text('tier').default('Team'),
  totalSeats: integer('total_seats').default(10).notNull(),
  usedSeats: integer('used_seats').default(0).notNull(),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appSettings = pgTable('app_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).unique().notNull(),
  allowedApps: jsonb('allowed_apps').default([]),
  lockdownSettings: jsonb('lockdown_settings').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  priority: text('priority').default('medium'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const spiritualStreaks = pgTable('spiritual_streaks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  disciplineName: text('discipline_name').notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  lastLoggedDate: date('last_logged_date'),
  metadata: jsonb('metadata').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userDisciplineIdx: {
      columns: [table.userUid, table.disciplineName],
      unique: true,
    },
  };
});

export const spiritualLogs = pgTable('spiritual_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  discipline_name: text('discipline_name').notNull(),
  durationMinutes: integer('duration_minutes').default(0).notNull(),
  notes: text('notes'),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
});

export const resellerCommissions = pgTable('reseller_commissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  resellerUid: text('reseller_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  referredUserUid: text('referred_user_uid').notNull(),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).default('0.50').notNull(),
  status: text('status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  note: text('note'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
