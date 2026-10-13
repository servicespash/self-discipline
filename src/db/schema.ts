import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, decimal, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').unique().notNull(),
  email: text('email').unique().notNull(),
  moniker: text('moniker'),
  role: text('role').default('student'),
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
  clicks: integer('clicks').default(0).notNull(),
  assignedMembers: jsonb('assigned_members').default([]),
  referredUsers: jsonb('referred_users').default([]),
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
});

export const spiritualLogs = pgTable('spiritual_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userUid: text('user_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  disciplineName: text('discipline_name').notNull(),
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
