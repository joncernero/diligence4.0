import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { observations } from './walks';

// ============================================
// CONSTRUCTION CODES (CSI MasterFormat)
// ============================================
export const constructionCodes = pgTable('construction_codes', {
  id: serial('id').primaryKey(),
  
  // Code Info
  code: varchar('code', { length: 20 }).notNull().unique(), // "03 30 00"
  title: varchar('title', { length: 255 }).notNull(), // "Cast-in-Place Concrete"
  division: varchar('division', { length: 5 }).notNull(), // "03"
  divisionTitle: varchar('division_title', { length: 255 }), // "Concrete"
  
  // Format
  formatVersion: varchar('format_version', { length: 10 }).notNull(), // "16" or "50"
  
  // Optional
  description: text('description'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PROJECT SCOPE ITEMS
// ============================================
export const projectScopeItems = pgTable('project_scope_items', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  
  // Scope Details
  scopeName: varchar('scope_name', { length: 255 }).notNull(),
  description: text('description'),
  csiCodeId: integer('csi_code_id').references(() => constructionCodes.id),
  
  // Cost
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('planned'),
  // 'planned', 'in_progress', 'completed', 'on_hold'
  
  // Application
  appliesToUnitTypes: jsonb('applies_to_unit_types'), // Array of unit type IDs
  appliesToAllUnits: boolean('applies_to_all_units').default(false),
  
  // Dates
  startDate: timestamp('start_date'),
  completionDate: timestamp('completion_date'),
  
  // Metadata
  notes: text('notes'),
  createdBy: integer('created_by'), // references users.id
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SCOPE ITEM MATERIALS (Optional - for detailed tracking)
// ============================================
export const scopeItemMaterials = pgTable('scope_item_materials', {
  id: serial('id').primaryKey(),
  scopeItemId: integer('scope_item_id').references(() => projectScopeItems.id).notNull(),
  
  materialName: varchar('material_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }),
  unit: varchar('unit', { length: 50 }), // 'sqft', 'lf', 'ea', 'ton'
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  supplier: varchar('supplier', { length: 255 }),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// LINK: OBSERVATIONS TO SCOPE ITEMS
// ============================================
export const observationScopeLinks = pgTable('observation_scope_links', {
  id: serial('id').primaryKey(),
  observationId: integer('observation_id').references(() => observations.id).notNull(),
  scopeItemId: integer('scope_item_id').references(() => projectScopeItems.id).notNull(),
  
  notes: text('notes'), // Why this observation relates to this scope item
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const constructionCodesRelations = relations(constructionCodes, ({ many }) => ({
  scopeItems: many(projectScopeItems),
}));

export const projectScopeItemsRelations = relations(projectScopeItems, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectScopeItems.projectId],
    references: [projects.id],
  }),
  csiCode: one(constructionCodes, {
    fields: [projectScopeItems.csiCodeId],
    references: [constructionCodes.id],
  }),
  materials: many(scopeItemMaterials),
  observationLinks: many(observationScopeLinks),
}));

export const scopeItemMaterialsRelations = relations(scopeItemMaterials, ({ one }) => ({
  scopeItem: one(projectScopeItems, {
    fields: [scopeItemMaterials.scopeItemId],
    references: [projectScopeItems.id],
  }),
}));

export const observationScopeLinksRelations = relations(observationScopeLinks, ({ one }) => ({
  observation: one(observations, {
    fields: [observationScopeLinks.observationId],
    references: [observations.id],
  }),
  scopeItem: one(projectScopeItems, {
    fields: [observationScopeLinks.scopeItemId],
    references: [projectScopeItems.id],
  }),
}));
