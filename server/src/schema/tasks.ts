import { pgTable, serial, varchar, text, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { users } from './users';
import { propertyWalks } from './walks';

// ============================================
// PROJECT TASKS
// ============================================
export const projectTasks = pgTable('project_tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  
  // Task Details
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  // 'meeting', 'deadline', 'inspection', 'milestone', 'follow_up', 'delivery', 'other'
  
  // Dates
  scheduledDate: timestamp('scheduled_date').notNull(),
  dueDate: timestamp('due_date'),
  completedDate: timestamp('completed_date'),
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // 'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
  priority: varchar('priority', { length: 50 }).default('medium'),
  // 'low', 'medium', 'high', 'urgent'
  
  // Links
  linkedToWalkId: integer('linked_to_walk_id').references(() => propertyWalks.id),
  
  // Metadata
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [projectTasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [projectTasks.createdBy],
    references: [users.id],
  }),
  linkedWalk: one(propertyWalks, {
    fields: [projectTasks.linkedToWalkId],
    references: [propertyWalks.id],
  }),
}));
