-- ============================================================
-- Migration: Multi-tenant data isolation + subscription tiers
-- ============================================================

-- 1. Add subscription_tier to organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "subscription_tier" varchar(50) DEFAULT 'standard' NOT NULL;

-- 2. Scope properties to an organization
ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "organizations"("id");

-- Backfill: assign existing properties to org 1 if any exist
UPDATE "properties" SET "org_id" = 1 WHERE "org_id" IS NULL;

-- Enforce NOT NULL going forward
ALTER TABLE "properties" ALTER COLUMN "org_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "properties_org_id_idx" ON "properties" ("org_id");

-- 3. Scope property_walks to an organization
ALTER TABLE "property_walks"
  ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "organizations"("id");

-- Backfill walks from their parent project's org
UPDATE "property_walks" pw
  SET "org_id" = p."org_id"
  FROM "projects" p
  WHERE pw."project_id" = p."id"
    AND pw."org_id" IS NULL;

-- Fallback: any walks without a project, assign to org 1
UPDATE "property_walks" SET "org_id" = 1 WHERE "org_id" IS NULL;

ALTER TABLE "property_walks" ALTER COLUMN "org_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "property_walks_org_id_idx" ON "property_walks" ("org_id");

-- 4. Scope project_documents to an organization
ALTER TABLE "project_documents"
  ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "organizations"("id");

-- Backfill documents from their parent project's org
UPDATE "project_documents" pd
  SET "org_id" = p."org_id"
  FROM "projects" p
  WHERE pd."project_id" = p."id"
    AND pd."org_id" IS NULL;

-- Fallback
UPDATE "project_documents" SET "org_id" = 1 WHERE "org_id" IS NULL;

ALTER TABLE "project_documents" ALTER COLUMN "org_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "project_documents_org_id_idx" ON "project_documents" ("org_id");

-- 5. Index on projects.org_id (if not already present)
CREATE INDEX IF NOT EXISTS "projects_org_id_idx" ON "projects" ("org_id");
