import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ============================================
// RESIDENT INVITES
// Tracks pending invitations sent by PMs
// ============================================
export const residentInvites = pgTable('resident_invites', {
  id: serial('id').primaryKey(),

  // Who's being invited
  email: varchar('email', { length: 255 }).notNull(),

  // Where they live
  propertyId: integer('property_id').notNull(),
  buildingId: integer('building_id'),   // optional — whole-property residents
  unitNumber: varchar('unit_number', { length: 50 }), // human-readable unit label

  // Project context
  projectId: integer('project_id').notNull(),

  // Invite token (sent in email link)
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),

  // Who sent it
  invitedBy: integer('invited_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RESIDENT UNITS
// Links a resident user to their property/unit
// ============================================
export const residentUnits = pgTable('resident_units', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  propertyId: integer('property_id').notNull(),
  buildingId: integer('building_id'),
  unitNumber: varchar('unit_number', { length: 50 }),
  projectId: integer('project_id').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const residentInvitesRelations = relations(residentInvites, ({ one }) => ({
  invitedByUser: one(users, {
    fields: [residentInvites.invitedBy],
    references: [users.id],
  }),
}));

export const residentUnitsRelations = relations(residentUnits, ({ one }) => ({
  user: one(users, {
    fields: [residentUnits.userId],
    references: [users.id],
  }),
}));
