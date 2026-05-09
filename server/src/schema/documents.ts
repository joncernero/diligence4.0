import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { users, organizations } from './users';
import { projectScopeItems } from './scope';

// ============================================
// DOCUMENT CATEGORIES
// ============================================
export const documentCategories = pgTable('document_categories', {
  id: serial('id').primaryKey(),
  categoryName: varchar('category_name', { length: 100 }).notNull(),
  description: text('description'),
  iconName: varchar('icon_name', { length: 50 }), // Icon name for UI
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PROJECT DOCUMENTS
// ============================================
export const projectDocuments = pgTable('project_documents', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  categoryId: integer('category_id').references(() => documentCategories.id),
  
  // Document Info
  documentName: varchar('document_name', { length: 255 }).notNull(),
  description: text('description'),
  
  // File Details
  fileUrl: text('file_url').notNull(),
  fileKey: text('file_key').notNull(), // R2 key for deletion
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Version Control
  version: integer('version').default(1),
  parentDocumentId: integer('parent_document_id'), // References earlier version
  isLatestVersion: boolean('is_latest_version').default(true),
  
  // Links
  linkedToScopeId: integer('linked_to_scope_id').references(() => projectScopeItems.id),
  
  // Tags & Search
  tags: jsonb('tags'), // Array of tags
  
  // Metadata
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// DOCUMENT VERSIONS (History)
// ============================================
export const documentVersions = pgTable('document_versions', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => projectDocuments.id).notNull(),
  
  versionNumber: integer('version_number').notNull(),
  fileUrl: text('file_url').notNull(),
  fileKey: text('file_key').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  
  changeNote: text('change_note'), // What changed in this version
  
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const documentCategoriesRelations = relations(documentCategories, ({ many }) => ({
  documents: many(projectDocuments),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projectDocuments.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [projectDocuments.projectId],
    references: [projects.id],
  }),
  category: one(documentCategories, {
    fields: [projectDocuments.categoryId],
    references: [documentCategories.id],
  }),
  scopeItem: one(projectScopeItems, {
    fields: [projectDocuments.linkedToScopeId],
    references: [projectScopeItems.id],
  }),
  uploader: one(users, {
    fields: [projectDocuments.uploadedBy],
    references: [users.id],
  }),
  versions: many(documentVersions),
  parentDocument: one(projectDocuments, {
    fields: [projectDocuments.parentDocumentId],
    references: [projectDocuments.id],
  }),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(projectDocuments, {
    fields: [documentVersions.documentId],
    references: [projectDocuments.id],
  }),
  uploader: one(users, {
    fields: [documentVersions.uploadedBy],
    references: [users.id],
  }),
}));
