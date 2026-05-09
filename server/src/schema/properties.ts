import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './users';

// ============================================
// PROPERTIES
// ============================================
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  propName: varchar('prop_name', { length: 255 }).notNull(),
  propAddress: text('prop_address').notNull(),
  propCity: varchar('prop_city', { length: 100 }),
  propState: varchar('prop_state', { length: 2 }),
  propZip: varchar('prop_zip', { length: 10 }),
  propCounty: varchar('prop_county', { length: 100 }),
  propParcelNumber: varchar('prop_parcel_number', { length: 100 }),
  propType: varchar('prop_type', { length: 100 }), // 'apartment', 'condo', 'mixed_use'
  totalUnits: integer('total_units'),
  totalBuildings: integer('total_buildings'),
  lotSizeAcres: decimal('lot_size_acres', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BUILDINGS
// ============================================
export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  buildingNumber: varchar('building_number', { length: 50 }).notNull(),
  buildingName: varchar('building_name', { length: 255 }),
  totalUnits: integer('total_units'),
  floors: integer('floors'),
  buildingType: varchar('building_type', { length: 100 }),
  squareFootage: decimal('square_footage', { precision: 10, scale: 2 }),
  constructionType: varchar('construction_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// UNITS
// ============================================
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  unitNumber: varchar('unit_number', { length: 50 }).notNull(),
  unitType: varchar('unit_type', { length: 50 }), // '1bed1bath', '2bed2bath', 'studio'
  floorNumber: integer('floor_number'),
  squareFootage: decimal('square_footage', { precision: 10, scale: 2 }),
  isStandard: boolean('is_standard').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [properties.orgId],
    references: [organizations.id],
  }),
  buildings: many(buildings),
}));

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  property: one(properties, {
    fields: [buildings.propertyId],
    references: [properties.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  building: one(buildings, {
    fields: [units.buildingId],
    references: [buildings.id],
  }),
}));
