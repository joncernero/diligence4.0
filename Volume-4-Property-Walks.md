# Diligence 4.0 — Volume 4: Property & Walks System
*Session: February 17, 2026*

---

## 🎯 Overview

Built the complete property management system including property details, buildings, unit types, property walks scheduling, and observation tracking with photo uploads to Cloudflare R2.

---

## 🏗️ Phase 1: Property Details

### What Was Built
- Property details page with address and stats
- Buildings grid showing each building
- Unit type breakdown (count-based, not individual records)
- "View Walks" button linking to walks system

### Files Created
```
client/app/dashboard/projects/[id]/property/page.tsx
```

### Key Design: Count-Based Units
Instead of individual unit records, we use:

```
Unit Type Templates → Buildings → Counts
     2bed/2bath    →  Building A  →  10
     1bed/1bath    →  Building A  →   5
     2bed/2bath    →  Building B  →   8
```

**Benefits:**
- Scales to 1000+ units without 1000+ rows
- Update template → affects all units of that type
- Floor plans stored once per type, not per unit
- Variance tracked via observations ("Unit 203 has issue")

### Property Page Layout
```
┌─────────────────────────────────────────┐
│ ← Property Name          [View Walks]  │
│   📍 Full Address                       │
├─────────────────────────────────────────┤
│ [Buildings] [Total Units] [Types] [Type]│
├─────────────────────────────────────────┤
│ Unit Types                              │
│ [2bed/2bath: 15] [1bed/1bath: 10]      │
│                    [Manage Unit Types]  │
├─────────────────────────────────────────┤
│ Buildings                               │
│ [Building A] [Building B] [Building C]  │
│  Units: 15    Units: 10    Units: 0    │
│  Mix:         Mix:                      │
│  2bd: 10      2bd: 8                   │
│  1bd: 5       1bd: 2                   │
└─────────────────────────────────────────┘
```

---

## 🚶 Phase 2: Property Walks

### Database Tables Created
```sql
property_walks
├─ id, projectId, propertyId
├─ walkDate, walkType, walkStatus
├─ conductedBy, attendees (JSON)
├─ notes, weatherConditions
└─ createdBy, timestamps

observations
├─ id, walkId, projectId
├─ buildingId, unitId (optional), location (freetext)
├─ title, description
├─ category, severity, priority
├─ assignedTo, tradeType
├─ status, dueDate
└─ createdBy, timestamps

observation_photos
├─ id, observationId
├─ photoUrl, photoKey (R2 key)
├─ fileName, fileSize, mimeType
├─ caption, photoType (before/after/in_progress)
└─ uploadedBy, uploadedAt

observation_comments
├─ id, observationId
├─ comment, commentType
└─ userId, createdAt
```

### Walk Types
| Type | When Used |
|------|-----------|
| pre_construction | Before work begins |
| progress | During construction |
| final | End of project |
| punch_list | Deficiency walk |
| warranty | Post-completion |

### Observation Categories
| Category | Description |
|----------|-------------|
| deficiency | Work not meeting standards |
| safety | Hazard or safety concern |
| quality | Quality control issue |
| code_violation | Building code issue |
| punch_item | Item on punch list |
| note | General observation |

### Observation Status Workflow
```
open → in_progress → resolved → verified → closed
                  ↘ wont_fix
```

### Trade Types
plumbing, electrical, hvac, framing, drywall, paint, flooring, roofing, concrete, other

---

## 📸 Phase 3: Photo Uploads (Cloudflare R2)

### R2 Setup Required
```env
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=construction-pm-photos
```

### How Photos Are Stored
```
observations/1234567890-abc123.jpg   ← Observation photos
floor-plans/1234567890-xyz789.pdf    ← Unit type floor plans
```

### Upload Flow
1. User selects file (max 10MB, images only)
2. Preview shown in browser
3. Optional caption added
4. File sent as multipart/form-data
5. Multer parses file on backend
6. File uploaded to R2 with unique key
7. URL + key saved to `observation_photos` table

---

## 🏢 Phase 4: Unit Type Templates

### Database Tables Created
```sql
unit_type_templates
├─ id, propertyId
├─ typeName (2bed/2bath)
├─ bedrooms, bathrooms, squareFootage
├─ floorPlanUrl, floorPlanKey
├─ finishes (JSON), amenities (JSON)
└─ notes, isActive, timestamps

building_unit_counts
├─ id
├─ buildingId
├─ unitTypeId
└─ count
```

### Finishes JSON Example
```json
{
  "flooring": "LVP",
  "countertops": "Quartz",
  "appliances": "Stainless Steel",
  "cabinets": "White Shaker",
  "fixtures": "Brushed Nickel"
}
```

### Amenities JSON Example
```json
{
  "balcony": true,
  "washer_dryer": "in-unit",
  "parking": "assigned",
  "storage": "unit",
  "dishwasher": true
}
```

---

## 🗺️ Full URL Structure

```
/dashboard                                  → Dashboard
/dashboard/projects                         → Projects list
/dashboard/projects/[id]                    → Project details
/dashboard/projects/[id]/property           → Property & buildings
/dashboard/projects/[id]/property/unit-types → Unit types management (planned)
/dashboard/projects/[id]/walks              → Walks list
/dashboard/projects/[id]/walks/[walkId]     → Walk details + observations
```

---

## 🔧 Backend Packages Added

```bash
# R2 / file upload
npm install @aws-sdk/client-s3 multer
npm install --save-dev @types/multer
```

---

## ⚠️ Issues & Fixes

### Typo in AddObservationForm.tsx
**Problem:** `@tantml:react-query` instead of `@tanstack/react-query`
**Fix:**
```bash
sed -i '' 's/@tantml:react-query/@tanstack\/react-query/g' components/AddObservationForm.tsx
```

### Properties API 404
**Problem:** Backend properties route not registered
**Fix:** Add to server.ts:
```typescript
import { propertiesRouter } from './routes/properties';
app.use('/api/properties', propertiesRouter);
```

### DB Push Command
**Problem:** `npx drizzle-kit push` fails
**Fix:** Always use `npx drizzle-kit push:pg`

---

## 📋 Backend API Routes Reference

### Walks
```
GET    /api/walks?projectId=1    ← All walks for a project
GET    /api/walks/:id            ← Single walk with observations
POST   /api/walks                ← Create walk
PUT    /api/walks/:id            ← Update walk (status, notes)
DELETE /api/walks/:id            ← Delete walk
```

### Observations
```
GET    /api/observations?walkId=1      ← Observations for a walk
GET    /api/observations/:id           ← Single observation
POST   /api/observations               ← Create observation
PUT    /api/observations/:id           ← Update (status, assignment)
POST   /api/observations/:id/comments  ← Add comment
POST   /api/observations/:id/photos    ← Upload photo (multipart)
```

### Unit Types
```
GET    /api/unit-types?propertyId=1   ← All types for property
GET    /api/unit-types/:id            ← Single type
POST   /api/unit-types                ← Create type
PUT    /api/unit-types/:id            ← Update type
POST   /api/unit-types/:id/floor-plan ← Upload floor plan (multipart)
POST   /api/unit-types/:id/building-counts ← Set unit counts
```
