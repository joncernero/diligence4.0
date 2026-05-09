import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ============================================
// BULLETINS
// PM-authored announcements sent to residents
// ============================================
export const bulletins = pgTable('bulletins', {
  id: serial('id').primaryKey(),

  // Scope
  projectId: integer('project_id').notNull(),
  propertyId: integer('property_id').notNull(),

  // Target — who sees it
  // 'all'      → all residents on the property
  // 'building' → residents in a specific building
  // 'unit'     → residents in a specific unit
  targetType: varchar('target_type', { length: 20 }).notNull().default('all'),
  targetBuildingId: integer('target_building_id'),
  targetUnitNumber: varchar('target_unit_number', { length: 50 }),

  // Content
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  category: varchar('category', { length: 50 }).default('general'),
  // 'general' | 'work_notice' | 'utility_shutoff' | 'access_notice' | 'completion'

  // Scheduled date — when the work/event actually occurs
  // Set by PM; surfaces on resident calendar alongside walks
  scheduledDate: timestamp('scheduled_date'),

  // Lifecycle
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),

  // Push notification status
  pushSent: boolean('push_sent').default(false),
  pushSentAt: timestamp('push_sent_at'),

  // Author
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BULLETIN READS
// Tracks which residents have read a bulletin
// ============================================
export const bulletinReads = pgTable('bulletin_reads', {
  id: serial('id').primaryKey(),
  bulletinId: integer('bulletin_id').references(() => bulletins.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  readAt: timestamp('read_at').defaultNow(),
});

// ============================================
// PUSH SUBSCRIPTIONS
// Web Push API subscription endpoints per user
// ============================================
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),   // public key
  auth: text('auth').notNull(),        // auth secret
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

// ============================================
// RELATIONS
// ============================================
export const bulletinsRelations = relations(bulletins, ({ one, many }) => ({
  author: one(users, {
    fields: [bulletins.createdBy],
    references: [users.id],
  }),
  reads: many(bulletinReads),
}));

export const bulletinReadsRelations = relations(bulletinReads, ({ one }) => ({
  bulletin: one(bulletins, {
    fields: [bulletinReads.bulletinId],
    references: [bulletins.id],
  }),
  user: one(users, {
    fields: [bulletinReads.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));
