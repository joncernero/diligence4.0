import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { properties } from './properties';

// ============================================
// UNIT TYPE TEMPLATES
// ============================================
export const unitTypeTemplates = pgTable('unit_type_templates', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  
  // Basic Info
  typeName: varchar('type_name', { length: 100 }).notNull(), // "2bed/2bath", "1bed/1bath"
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }).notNull(), // 1.5, 2.0, etc.
  squareFootage: integer('square_footage'),
  
  // Floor Plan
  floorPlanUrl: text('floor_plan_url'), // PDF or image in R2
  floorPlanKey: text('floor_plan_key'), // R2 key for deletion
  
  // Specifications
  finishes: jsonb('finishes'), // { flooring: "LVP", countertops: "Quartz", appliances: "Stainless" }
  amenities: jsonb('amenities'), // { balcony: true, washer_dryer: "in-unit", parking: "assigned" }
  notes: text('notes'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BUILDING UNIT COUNTS
// ============================================
export const buildingUnitCounts = pgTable('building_unit_counts', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull(), // references buildings.id
  unitTypeId: integer('unit_type_id').references(() => unitTypeTemplates.id).notNull(),
  
  count: integer('count').notNull().default(0), // How many of this type in this building
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const unitTypeTemplatesRelations = relations(unitTypeTemplates, ({ one, many }) => ({
  property: one(properties, {
    fields: [unitTypeTemplates.propertyId],
    references: [properties.id],
  }),
  buildingCounts: many(buildingUnitCounts),
}));

export const buildingUnitCountsRelations = relations(buildingUnitCounts, ({ one }) => ({
  unitType: one(unitTypeTemplates, {
    fields: [buildingUnitCounts.unitTypeId],
    references: [unitTypeTemplates.id],
  }),
}));
