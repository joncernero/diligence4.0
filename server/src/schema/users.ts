import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ORGANIZATIONS
// ============================================
// Subscription tiers:
//   'standard'     — base product, no customization
//   'professional' — custom branding, extra report exports
//   'enterprise'   — white-label, SSO, advanced analytics, dedicated support
export const SUBSCRIPTION_TIERS = ['standard', 'professional', 'enterprise'] as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];

// Feature flags stored in org_settings.features:
//   custom_branding      — logo, colors (professional+)
//   advanced_exports     — PDF/Excel walk reports (professional+)
//   resident_portal      — resident-facing portal (professional+)
//   white_label          — remove all Diligence branding (enterprise)
//   sso                  — SAML/OIDC single sign-on (enterprise)
//   advanced_analytics   — cross-project dashboards (enterprise)
//   dedicated_support    — priority SLA (enterprise)

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  orgName: varchar('org_name', { length: 255 }).notNull(),
  orgType: varchar('org_type', { length: 50 }).notNull(), // 'gc', 'owner', 'subcontractor', 'client'
  orgAddress: text('org_address'),
  orgPhone: varchar('org_phone', { length: 20 }),
  orgEmail: varchar('org_email', { length: 255 }),
  orgLogoUrl: text('org_logo_url'),
  orgSettings: jsonb('org_settings').$type<{
    features?: Record<string, boolean>;
    branding?: {
      primaryColor?: string;
      logoUrl?: string;
      companyName?: string;
    };
    [key: string]: unknown;
  }>(), // Company-specific configs & feature flags
  subscriptionTier: varchar('subscription_tier', { length: 50 })
    .notNull()
    .default('standard'), // 'standard' | 'professional' | 'enterprise'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// USERS (with PE/PC roles & departments)
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id),
  
  // Identity
  userEmail: varchar('user_email', { length: 255 }).unique().notNull(),
  userPasswordHash: varchar('user_password_hash', { length: 255 }).notNull(),
  userFirst: varchar('user_first', { length: 100 }).notNull(),
  userLast: varchar('user_last', { length: 100 }).notNull(),
  userPhone: varchar('user_phone', { length: 20 }),
  
  // Role & Department
  userRole: varchar('user_role', { length: 50 }).notNull(), 
  // 'admin', 'pm', 'super', 'pe', 'pc', 'gc', 'sub', 'client_view'
  userDepartment: varchar('user_department', { length: 100 }),
  // 'new_construction', 'redevelopment', 'exteriors', 'finance', NULL (for external)
  
  // Permissions
  userPermissions: jsonb('user_permissions'), // Custom permission overrides
  
  // Status
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// USER PROJECT ACCESS
// ============================================
export const userProjectAccess = pgTable('user_project_access', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  projectId: integer('project_id').notNull(), // Will reference projects.id
  accessLevel: varchar('access_level', { length: 50 }).notNull(), // 'owner', 'editor', 'viewer', 'restricted'
  canViewFinancials: boolean('can_view_financials').default(false),
  canEditBudget: boolean('can_edit_budget').default(false),
  canApprove: boolean('can_approve').default(false),
  grantedBy: integer('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  projectAccess: many(userProjectAccess),
}));

export const userProjectAccessRelations = relations(userProjectAccess, ({ one }) => ({
  user: one(users, {
    fields: [userProjectAccess.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [userProjectAccess.grantedBy],
    references: [users.id],
  }),
}));
