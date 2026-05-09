import { pgTable, serial, varchar, text, timestamp, boolean, integer, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, organizations } from './users';
import { projects } from './projects';
import { properties } from './properties';

// ============================================
// PROPERTY WALKS
// ============================================
export const propertyWalks = pgTable('property_walks', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  
  // Walk Details
  walkDate: timestamp('walk_date').notNull(),
  walkType: varchar('walk_type', { length: 100 }).notNull(), 
  // 'pre_construction', 'progress', 'final', 'punch_list', 'warranty'
  walkStatus: varchar('walk_status', { length: 50 }).notNull().default('scheduled'),
  // 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  // Participants
  conductedBy: integer('conducted_by').references(() => users.id),
  attendees: jsonb('attendees'), // Array of user IDs and external emails
  
  // Notes
  notes: text('notes'),
  weatherConditions: varchar('weather_conditions', { length: 255 }),
  
  // Metadata
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// ============================================
// OBSERVATIONS
// ============================================
export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  walkId: integer('walk_id').references(() => propertyWalks.id).notNull(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  
  // Location
  buildingId: integer('building_id'), // Optional - references buildings.id
  unitId: integer('unit_id'), // Optional - references units.id
  location: varchar('location', { length: 255 }), // Free text: "Building A, Unit 101, Kitchen"
  
  // Observation Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  // 'deficiency', 'safety', 'quality', 'code_violation', 'punch_item', 'note'
  severity: varchar('severity', { length: 50 }),
  // 'critical', 'major', 'minor', 'cosmetic'
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  assignedToOrgId: integer('assigned_to_org_id'), // For contractors
  tradeType: varchar('trade_type', { length: 100 }), 
  // 'plumbing', 'electrical', 'hvac', 'framing', 'drywall', 'paint', 'flooring', etc.
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('open'),
  // 'open', 'in_progress', 'resolved', 'verified', 'closed', 'wont_fix'
  priority: varchar('priority', { length: 50 }),
  // 'low', 'medium', 'high', 'urgent'
  
  // Dates
  dueDate: date('due_date'),
  resolvedAt: timestamp('resolved_at'),
  verifiedAt: timestamp('verified_at'),
  
  // Metadata
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// OBSERVATION PHOTOS
// ============================================
export const observationPhotos = pgTable('observation_photos', {
  id: serial('id').primaryKey(),
  observationId: integer('observation_id').references(() => observations.id).notNull(),
  
  // Photo Details
  photoUrl: text('photo_url').notNull(),
  photoKey: text('photo_key'), // Storage key for deletion
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Optional
  caption: text('caption'),
  photoType: varchar('photo_type', { length: 50 }).default('before'),
  // 'before', 'after', 'in_progress'
  
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// ============================================
// OBSERVATION COMMENTS
// ============================================
export const observationComments = pgTable('observation_comments', {
  id: serial('id').primaryKey(),
  observationId: integer('observation_id').references(() => observations.id).notNull(),
  
  comment: text('comment').notNull(),
  commentType: varchar('comment_type', { length: 50 }).default('comment'),
  // 'comment', 'status_change', 'assignment', 'resolution'
  
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const propertyWalksRelations = relations(propertyWalks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [propertyWalks.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [propertyWalks.projectId],
    references: [projects.id],
  }),
  property: one(properties, {
    fields: [propertyWalks.propertyId],
    references: [properties.id],
  }),
  conductor: one(users, {
    fields: [propertyWalks.conductedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [propertyWalks.createdBy],
    references: [users.id],
  }),
  observations: many(observations),
}));

export const observationsRelations = relations(observations, ({ one, many }) => ({
  walk: one(propertyWalks, {
    fields: [observations.walkId],
    references: [propertyWalks.id],
  }),
  project: one(projects, {
    fields: [observations.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [observations.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [observations.createdBy],
    references: [users.id],
  }),
  photos: many(observationPhotos),
  comments: many(observationComments),
}));

export const observationPhotosRelations = relations(observationPhotos, ({ one }) => ({
  observation: one(observations, {
    fields: [observationPhotos.observationId],
    references: [observations.id],
  }),
  uploader: one(users, {
    fields: [observationPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const observationCommentsRelations = relations(observationComments, ({ one }) => ({
  observation: one(observations, {
    fields: [observationComments.observationId],
    references: [observations.id],
  }),
  user: one(users, {
    fields: [observationComments.userId],
    references: [users.id],
  }),
}));
