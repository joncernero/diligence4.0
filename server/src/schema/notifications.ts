import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Notification Details
  type: varchar('type', { length: 50 }).notNull(),
  // 'observation_assigned', 'task_reminder', 'walk_scheduled', 'document_uploaded', 
  // 'task_overdue', 'observation_updated', 'comment_added'
  
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Links
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'observation', 'task', 'walk', 'document'
  relatedEntityId: integer('related_entity_id'),
  actionUrl: text('action_url'), // URL to navigate to when clicked
  
  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),

  // Lifecycle — cleared notifications are hidden from inbox; archived are kept for history
  isCleared: boolean('is_cleared').default(false),
  clearedAt: timestamp('cleared_at'),
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),

  // Auto-clear trigger — when a related entity reaches this status, clear the notification
  autoClearOnStatus: varchar('auto_clear_on_status', { length: 50 }),
  // e.g. 'completed' for walk reminders, 'resolved' for observation alerts

  // Email
  emailSent: boolean('email_sent').default(false),
  emailSentAt: timestamp('email_sent_at'),

  // Push
  pushSent: boolean('push_sent').default(false),
  pushSentAt: timestamp('push_sent_at'),
  
  // Metadata
  metadata: jsonb('metadata'), // Additional data (project name, etc.)
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// NOTIFICATION PREFERENCES
// ============================================
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Email Preferences
  emailObservationAssigned: boolean('email_observation_assigned').default(true),
  emailTaskReminder: boolean('email_task_reminder').default(true),
  emailTaskOverdue: boolean('email_task_overdue').default(true),
  emailWalkScheduled: boolean('email_walk_scheduled').default(true),
  emailDocumentUploaded: boolean('email_document_uploaded').default(false),
  emailCommentAdded: boolean('email_comment_added').default(true),
  
  // In-App Preferences
  inAppObservationAssigned: boolean('in_app_observation_assigned').default(true),
  inAppTaskReminder: boolean('in_app_task_reminder').default(true),
  inAppTaskOverdue: boolean('in_app_task_overdue').default(true),
  inAppWalkScheduled: boolean('in_app_walk_scheduled').default(true),
  inAppDocumentUploaded: boolean('in_app_document_uploaded').default(true),
  inAppCommentAdded: boolean('in_app_comment_added').default(true),
  
  // Task Reminder Settings
  taskReminderDaysBefore: integer('task_reminder_days_before').default(1), // Days before due date
  
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));
