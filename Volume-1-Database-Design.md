# Diligence 4.0 — Volume 1: Database Design
*Session: February 11, 2026*

---

## 🎯 Overview

This session established the complete database architecture for Diligence 4.0 — an enterprise construction project management system replacing paper-based property walk forms.

---

## 📊 Entity Groups (9 Total)

### 1. Organizations
- Multi-tenant support (GC, Owner, Subcontractor)
- `organizations` table with type, contact info, settings

### 2. Users
- Roles: `super`, `admin`, `pm`, `pe`, `pc`, `field`, `viewer`
- JWT-based auth with permissions JSON column
- Department assignment (new_construction, redevelopment, exteriors, finance)

### 3. Properties
- Physical real estate being managed
- Address, type (apartment, condo, mixed_use, etc.)
- Links to buildings

### 4. Buildings
- Belongs to a property
- Floors, square footage, building type
- Links to units

### 5. Units
- Individual dwelling units
- Unit number, type, floor, status
- Links to observations

### 6. Projects
- Core entity linking property, org, and team
- Types: new_construction, renovation, mixed, tenant_improvement
- Statuses: lead, proposal, active, on_hold, completed, archived
- Budget tracking (budgeted vs actual)

### 7. Property Walks
- Scheduled inspections of properties
- Types: pre_construction, progress, final, punch_list, warranty
- Statuses: scheduled, in_progress, completed, cancelled

### 8. Observations
- Issues/notes recorded during walks
- Categories: deficiency, safety, quality, code_violation, punch_item, note
- Severity: critical, major, minor, cosmetic
- Assigned to trades/contractors
- Status workflow: open → in_progress → resolved → verified → closed

### 9. Budgeting
- Budget line items per project
- Actual vs budgeted tracking

---

## 🗂️ Key Design Decisions

### Unit Type Approach (Revised in Phase 3)
**Original:** Individual unit records (Unit 101, 102, 103...)
**Revised:** Unit Type Templates + Building Counts
- Define templates (2bed/2bath, 1bed/1bath)
- Track counts per building (Building A: 10x 2bed, 5x 1bed)
- Saves space, easier management at scale

### Multi-Tenancy
- Every table has `org_id`
- Row-level security planned
- Users scoped to their organization

### Soft Deletes
- `is_active` flag on key tables
- Preserve audit trail

---

## 📁 Schema Files Created

```
server/src/schema/
├── users.ts          — Users, roles, auth
├── projects.ts       — Projects, org links
├── properties.ts     — Properties, buildings, units
├── walks.ts          — Property walks, observations, photos, comments
└── unitTypes.ts      — Unit type templates, building counts
```

---

## 🔗 Key Relationships

```
Organization
  └─ Users (many)
  └─ Projects (many)
  
Property
  └─ Buildings (many)
  └─ Unit Type Templates (many)
  
Building
  └─ Unit Type Counts (many)
  
Project
  └─ Property (one)
  └─ Project Manager / User (one)
  └─ GC Org (one)
  └─ Client Org (one)
  
Property Walk
  └─ Project (one)
  └─ Property (one)
  └─ Observations (many)
  
Observation
  └─ Walk (one)
  └─ Photos (many)
  └─ Comments (many)
```

---

## 🛠️ Technology Choices Made

| Layer | Choice | Reason |
|-------|--------|--------|
| Database | PostgreSQL (Neon) | Serverless, free tier, reliable |
| ORM | Drizzle ORM | Type-safe, lightweight |
| Auth | JWT (jsonwebtoken) | Stateless, simple |
| File Storage | Cloudflare R2 | S3-compatible, free egress |

---

## 🌱 Seed Data

Created initial test data:
- 2 Organizations (Acme Construction, River Development)
- 5 Users (admin, PM, PE, field worker, viewer)
- 1 Property (Riverside Apartments, 456 River Rd, Springfield IL)
- 3 Buildings (A, B, C)
- 2 Units (101 = 2bed/2bath, 102 = 1bed/1bath)
- 3 Projects (Riverside Phase 1, Riverside Phase 2, Pines of Edgewater, Oakwood Apartments)
