import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, organizations } from './users';

// ============================================
// MAINTENANCE REQUESTS
// Submitted by residents via the resident portal
// ============================================
export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),

  // Who submitted
  residentId: integer('resident_id').references(() => users.id).notNull(),

  // Where
  propertyId: integer('property_id').notNull(),
  projectId: integer('project_id').notNull(),
  unitNumber: varchar('unit_number', { length: 50 }),

  // Request details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  // 'plumbing', 'electrical', 'hvac', 'appliance', 'doors_windows', 'pest', 'other'

  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  // 'low', 'medium', 'high', 'urgent'

  status: varchar('status', { length: 50 }).notNull().default('submitted'),
  // 'submitted', 'acknowledged', 'in_progress', 'completed', 'closed'

  // Photos (array of { url, key, fileName, caption })
  photos: jsonb('photos').default([]),

  // Notes from staff
  staffNotes: text('staff_notes'),

  // Assignment (optional — can be linked to a user)
  assignedTo: integer('assigned_to').references(() => users.id),

  // Timestamps
  acknowledgedAt: timestamp('acknowledged_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  resident: one(users, {
    fields: [maintenanceRequests.residentId],
    references: [users.id],
    relationName: 'maintenanceResident',
  }),
  assignee: one(users, {
    fields: [maintenanceRequests.assignedTo],
    references: [users.id],
    relationName: 'maintenanceAssignee',
  }),
  organization: one(organizations, {
    fields: [maintenanceRequests.orgId],
    references: [organizations.id],
  }),
}));
