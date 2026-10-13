import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique().notNull(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('student'), // student, guardian, trainer, admin
  tier: text('tier').default('free'), // free, pro, enterprise
  createdAt: timestamp('created_at').defaultNow(),
});

export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').references(() => users.uid),
  assignedEmail: text('assigned_email'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').references(() => users.uid),
  allowedApps: jsonb('allowed_apps'),
  lockdownSettings: jsonb('lockdown_settings'),
});
