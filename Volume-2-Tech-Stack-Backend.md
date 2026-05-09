# Diligence 4.0 — Volume 2: Tech Stack & Backend Setup
*Session: February 12, 2026*

---

## 🎯 Overview

This session selected the final tech stack, set up the full project structure, configured the backend server, and got the database connected and running.

---

## 🏗️ Final Tech Stack

### Backend
| Component | Choice | Version |
|-----------|--------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.x |
| Language | TypeScript | 5.x |
| ORM | Drizzle ORM | 0.29+ |
| Database | PostgreSQL (Neon) | 15 |
| Auth | JWT (jsonwebtoken) | 9.x |
| File Execution | tsx (watch mode) | - |

### Frontend
| Component | Choice | Version |
|-----------|--------|---------|
| Framework | Next.js 15 | App Router |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | - |
| Data Fetching | TanStack Query | v5 |
| HTTP Client | Axios | 1.x |
| Icons | Lucide React | - |

### Infrastructure
| Component | Choice |
|-----------|--------|
| Database | Neon (serverless Postgres) |
| File Storage | Cloudflare R2 |
| Hosting | TBD (Vercel/Railway) |

---

## 📁 Project Structure

```
diligence4.0/
├── server/                    ← Express backend (port 4000)
│   ├── src/
│   │   ├── schema/            ← Drizzle schema files
│   │   │   ├── users.ts
│   │   │   ├── projects.ts
│   │   │   ├── properties.ts
│   │   │   ├── walks.ts
│   │   │   └── unitTypes.ts
│   │   ├── routes/            ← API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── projects.ts
│   │   │   ├── properties.ts
│   │   │   ├── walks.ts
│   │   │   ├── observations.ts
│   │   │   └── unitTypes.ts
│   │   ├── middleware/
│   │   │   └── auth.ts        ← JWT middleware, requireRole
│   │   ├── db/
│   │   │   └── index.ts       ← Drizzle db connection
│   │   ├── utils/
│   │   │   └── r2Upload.ts    ← Cloudflare R2 utilities
│   │   └── server.ts          ← Express app entry point
│   ├── .env                   ← Environment variables
│   ├── drizzle.config.ts
│   └── package.json
│
└── client/                    ← Next.js frontend (port 3000)
    ├── app/
    │   ├── dashboard/
    │   │   ├── layout.tsx     ← Sidebar layout (wraps all pages)
    │   │   ├── page.tsx       ← Dashboard home
    │   │   └── projects/
    │   │       ├── page.tsx   ← Projects list
    │   │       └── [id]/
    │   │           ├── page.tsx        ← Project details
    │   │           ├── property/
    │   │           │   └── page.tsx    ← Property & units
    │   │           └── walks/
    │   │               ├── page.tsx    ← Walks list
    │   │               └── [walkId]/
    │   │                   └── page.tsx ← Walk details
    │   └── login/
    │       └── page.tsx
    ├── components/
    │   ├── ui/                ← shadcn components
    │   ├── CreateProjectForm.tsx
    │   ├── ScheduleWalkForm.tsx
    │   ├── AddObservationForm.tsx
    │   ├── PhotoUpload.tsx
    │   └── PhotoGallery.tsx
    ├── lib/
    │   ├── api.ts             ← Axios API client
    │   ├── auth.ts            ← Auth state (Zustand)
    │   └── utils.ts
    └── package.json
```

---

## 🔑 Environment Variables

### Server `.env`
```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudflare R2
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=construction-pm-photos
R2_PUBLIC_URL=  # Optional custom domain
```

---

## 🛣️ API Routes

### Auth
```
POST /api/auth/login
POST /api/auth/register
```

### Users
```
GET  /api/users/me
GET  /api/users
GET  /api/users/:id
```

### Projects
```
GET  /api/projects
GET  /api/projects/:id
POST /api/projects
PUT  /api/projects/:id
```

### Properties
```
GET  /api/properties
GET  /api/properties/:id
GET  /api/properties/:id/buildings
GET  /api/properties/:id/buildings/:buildingId/units
```

### Walks
```
GET  /api/walks?projectId=1
GET  /api/walks/:id
POST /api/walks
PUT  /api/walks/:id
DELETE /api/walks/:id
```

### Observations
```
GET  /api/observations?walkId=1
GET  /api/observations/:id
POST /api/observations
PUT  /api/observations/:id
POST /api/observations/:id/comments
POST /api/observations/:id/photos   ← Multipart upload to R2
```

### Unit Types
```
GET  /api/unit-types?propertyId=1
GET  /api/unit-types/:id
POST /api/unit-types
PUT  /api/unit-types/:id
POST /api/unit-types/:id/floor-plan  ← Multipart upload to R2
POST /api/unit-types/:id/building-counts
```

---

## 🔒 Auth Middleware

```typescript
// Roles hierarchy
super → admin → pm → pe → pc → field → viewer

// Usage in routes
router.post('/', requireAuth, requireRole(['admin', 'pm', 'super']), handler)
```

---

## 🗄️ Database Commands

```bash
# Push schema to database (use this version - drizzle-kit v0.20)
npx drizzle-kit push:pg

# DO NOT USE (newer syntax, not compatible)
npx drizzle-kit push --dialect=postgresql  # ← This fails!
```

---

## ⚠️ Known Issues & Fixes

### CORS Error on Project Create
**Problem:** Browser blocked cross-origin requests
**Fix:** Updated server.ts cors config:
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Tar File Extraction Issue
**Problem:** `tar -xzf file.tar.gz` creates subfolder instead of merging
**Fix:**
```bash
tar -xzf file.tar.gz
cp -r extracted-folder/server/* server/
cp -r extracted-folder/client/* client/
rm -rf extracted-folder/
```

### Drizzle-kit Push Command
**Problem:** `npx drizzle-kit push` fails
**Fix:** Use `npx drizzle-kit push:pg`

---

## 🚀 Running the App

```bash
# Terminal 1 - Backend
cd ~/Projects/diligence4.0/server
npm run dev
# Runs on http://localhost:4000

# Terminal 2 - Frontend
cd ~/Projects/diligence4.0/client
npm run dev
# Runs on http://localhost:3000

# Health check
curl http://localhost:4000/health
```
