import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { projects } from './projects';
import { properties } from './properties';

// ============================================
// WORK SCHEDULES  (crew / contractor calendar events)
// ============================================
export const workSchedules = pgTable('work_schedules', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  buildingId: integer('building_id'), // optional FK to buildings

  // What & Who
  title: varchar('title', { length: 255 }).notNull(),
  tradeType: varchar('trade_type', { length: 100 }).notNull(),
  // 'general', 'plumbing', 'electrical', 'hvac', 'framing', 'drywall',
  // 'paint', 'flooring', 'roofing', 'concrete', 'landscaping', 'inspection'
  contractor: varchar('contractor', { length: 255 }),

  // Where
  areaDescription: text('area_description'), // "Building A, Units 101-110"
  unitNumbers: jsonb('unit_numbers'), // ['101', '102', '103'] for targeted resident notices

  // When
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),

  // Status
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),
  // 'scheduled', 'in_progress', 'completed', 'cancelled'

  // Resident visibility
  notifyResidents: boolean('notify_residents').notNull().default(true),

  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// APPROVAL REQUESTS  (owner portal)
// ============================================
export const approvalRequests = pgTable('approval_requests', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),

  // Type of item needing approval
  type: varchar('type', { length: 100 }).notNull(),
  // 'material_selection', 'schedule_approval', 'change_order',
  // 'daily_report', 'rfi', 'submittals'

  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Workflow
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // 'pending', 'approved', 'rejected', 'info_requested', 'withdrawn'

  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  // 'low', 'medium', 'high', 'urgent'

  dueDate: date('due_date'),

  // Who submitted (PM/team)
  requestedBy: integer('requested_by').references(() => users.id),

  // Who responded (owner)
  respondedBy: integer('responded_by').references(() => users.id),
  respondedAt: timestamp('responded_at'),
  responseNote: text('response_note'),

  // File attachments: [{url, fileName, fileKey}]
  attachments: jsonb('attachments'),

  // Flexible data: cost estimates, material specs, etc.
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const workSchedulesRelations = relations(workSchedules, ({ one }) => ({
  project: one(projects, { fields: [workSchedules.projectId], references: [projects.id] }),
  property: one(properties, { fields: [workSchedules.propertyId], references: [properties.id] }),
  creator: one(users, { fields: [workSchedules.createdBy], references: [users.id] }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one }) => ({
  project: one(projects, { fields: [approvalRequests.projectId], references: [projects.id] }),
  requester: one(users, { fields: [approvalRequests.requestedBy], references: [users.id] }),
  responder: one(users, { fields: [approvalRequests.respondedBy], references: [users.id] }),
}));
