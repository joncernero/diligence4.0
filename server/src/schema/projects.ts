import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './users';
import { properties } from './properties';

// ============================================
// PROJECTS
// ============================================
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id')
    .references(() => organizations.id)
    .notNull(),

  // Project Info
  projectName: varchar('project_name', { length: 255 }).notNull(),
  projectNumber: varchar('project_number', { length: 50 }).unique(),
  projectType: varchar('project_type', { length: 100 }), // 'new_construction', 'renovation', 'mixed'
  projectStatus: varchar('project_status', { length: 50 }).notNull(),
  // 'lead', 'proposal', 'active', 'on_hold', 'completed', 'archived'
  projectDepartment: varchar('project_department', { length: 100 }),
  // 'new_construction', 'redevelopment', 'exteriors', 'finance'

  // Property & Stakeholders
  propertyId: integer('property_id'), // References properties.id
  projectManagerId: integer('project_manager_id').references(() => users.id),
  superintendentId: integer('superintendent_id').references(() => users.id),
  gcOrgId: integer('gc_org_id').references(() => organizations.id),
  clientOrgId: integer('client_org_id').references(() => organizations.id),

  // Timeline
  startDate: date('start_date'),
  estimatedCompletion: date('estimated_completion'),
  actualCompletion: date('actual_completion'),

  // Financials
  totalBudget: decimal('total_budget', { precision: 15, scale: 2 }),
  totalActual: decimal('total_actual', { precision: 15, scale: 2 }),

  // Metadata
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const projectsRelations = relations(projects, ({ one, many }) => ({
  property: one(properties, {
    fields: [projects.propertyId],
    references: [properties.id],
  }),
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
  }),
  gcOrg: one(organizations, {
    fields: [projects.gcOrgId],
    references: [organizations.id],
  }),
  clientOrg: one(organizations, {
    fields: [projects.clientOrgId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
}));
