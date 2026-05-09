# Diligence 4.0 — Master Documentation Index

> Enterprise Construction Project Management System
> Replacing paper-based property walk forms with a full-stack web application

---

## 📚 Volumes

| Volume | Title | Key Topics |
|--------|-------|------------|
| [Volume 1](./Volume-1-Database-Design.md) | Database Design | Schema, entities, relationships, seed data |
| [Volume 2](./Volume-2-Tech-Stack-Backend.md) | Tech Stack & Backend | Stack decisions, project structure, API routes, env vars |
| [Volume 3](./Volume-3-Frontend-Projects.md) | Frontend & Projects | Auth, dashboard, project CRUD, navigation |
| [Volume 4](./Volume-4-Property-Walks.md) | Property & Walks | Property pages, walks, observations, photos, unit types |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (Neon account)
- Cloudflare account (R2 for file storage)

### Run the App
```bash
# Terminal 1 - Backend
cd ~/Projects/diligence4.0/server
npm install
npm run dev        # Runs on http://localhost:4000

# Terminal 2 - Frontend
cd ~/Projects/diligence4.0/client
npm install
npm run dev        # Runs on http://localhost:3000
```

### Database Setup
```bash
cd server
npx drizzle-kit push:pg    # ← ALWAYS use push:pg not push
```

---

## 🗺️ Application Map

### Pages
```
/login                                     → Login
/dashboard                                 → Stats + recent projects
/dashboard/projects                        → Projects list
/dashboard/projects/[id]                   → Project details
/dashboard/projects/[id]/property          → Property + buildings + unit types
/dashboard/projects/[id]/walks             → Walks list
/dashboard/projects/[id]/walks/[walkId]    → Walk details + observations
```

### Key Components
```
components/
├── CreateProjectForm.tsx      → Create project modal
├── ScheduleWalkForm.tsx       → Schedule walk modal
├── AddObservationForm.tsx     → Add observation modal
├── PhotoUpload.tsx            → Upload photo to R2
└── PhotoGallery.tsx           → Display uploaded photos
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts and roles |
| organizations | Companies (GC, Owner, Sub) |
| projects | Construction projects |
| properties | Physical real estate |
| buildings | Buildings within a property |
| unit_type_templates | Standard unit layouts (2bed/2bath) |
| building_unit_counts | How many of each type per building |
| property_walks | Scheduled/completed walk events |
| observations | Issues recorded during walks |
| observation_photos | Photos uploaded to R2 |
| observation_comments | Comments/status changes on observations |

---

## 🔑 Environment Variables

### server/.env
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=construction-pm-photos
```

---

## 👤 Test Credentials

```
Admin:   admin@acme.com    / password123
PM:      pm@acme.com       / password123
PE:      pe@acme.com       / password123
Field:   field@acme.com    / password123
```

---

## ⚠️ Common Gotchas

| Issue | Fix |
|-------|-----|
| `npx drizzle-kit push` fails | Use `npx drizzle-kit push:pg` |
| Tar extracts to subfolder | `cp -r extracted/* ./` then `rm -rf extracted/` |
| CORS error | Check server.ts includes localhost:3000 in origins |
| "Route not found" | Check route registered in server.ts |
| Duplicate export error | Check api.ts for duplicate declarations |
| `@tantml:react-query` | Fix typo to `@tanstack/react-query` |

---

## 🎯 Feature Status

### ✅ Complete
- [x] Authentication (login/JWT)
- [x] Dashboard with stats
- [x] Projects (list, create, details)
- [x] Property details (buildings, unit types)
- [x] Unit type templates (count-based system)
- [x] Property walks (schedule, list, details)
- [x] Observations (create, status update, photos)
- [x] Photo uploads to Cloudflare R2

### 🚧 Planned
- [ ] Unit types management UI
- [ ] Assign observations to contractors
- [ ] Calendar integration
- [ ] Project scope items per unit type
- [ ] PDF reports
- [ ] Email notifications
- [ ] Mobile app

---

## 📅 Session History

| Date | Session | What Was Built |
|------|---------|----------------|
| Feb 11, 2026 | Session 1 | Database schema design |
| Feb 12, 2026 | Session 2 | Tech stack, project setup, backend |
| Feb 12-15, 2026 | Session 3 | Frontend, auth, dashboard, projects |
| Feb 17, 2026 | Session 4 | Property, walks, observations, photos, unit types |
