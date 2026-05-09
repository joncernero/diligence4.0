# Diligence 4.0 — Volume 3: Frontend & Project Management
*Session: February 12-15, 2026*

---

## 🎯 Overview

Built the complete frontend including authentication, dashboard, projects list, create project form, and project details page.

---

## 📦 Frontend Dependencies Installed

```bash
npm install @tanstack/react-query axios
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install class-variance-authority
```

---

## 🔐 Authentication System

### How It Works
1. User submits login form
2. POST `/api/auth/login` returns JWT token
3. Token stored in `localStorage`
4. Axios interceptor adds `Authorization: Bearer <token>` to all requests
5. 401 response → auto redirect to `/login`

### Auth State (`lib/auth.ts`)
```typescript
// Zustand store
const useAuth = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => { ... },
  logout: () => { ... },
}))
```

### Protected Routes
- Dashboard layout checks `isAuthenticated`
- Redirects to `/login` if not authenticated

---

## 🎨 UI Components (shadcn/ui)

Located in `components/ui/`:
| Component | File | Usage |
|-----------|------|-------|
| Button | button.tsx | All buttons |
| Card | card.tsx | Content containers |
| Input | input.tsx | Form fields |
| Label | label.tsx | Form labels |
| Dialog | dialog.tsx | Modals |
| Select | select.tsx | Dropdowns |
| Badge | badge.tsx | Status tags |

---

## 📱 Pages Built

### Login Page (`/login`)
- Email + password form
- JWT token stored on success
- Redirects to `/dashboard`

### Dashboard (`/dashboard`)
- Stats cards: Total Projects, Active, Open Issues, Critical Issues
- Recent projects list (clickable → project details)
- Sidebar navigation with active state highlighting

### Projects List (`/dashboard/projects`)
- Grid of project cards (3 columns)
- Status badges (active=green, proposal=yellow)
- Clickable cards → project details
- "New Project" button

### Create Project Form (Modal)
- Fields: Name*, Number, Type, Status, Department, PM, Dates, Budget
- Dropdown selects for type/status/department
- Users fetched for PM dropdown (filtered to pm/admin roles)
- TanStack Query mutation
- Auto-refresh list on success

### Project Details (`/dashboard/projects/[id]`)
- Header with project name, number, status badge, Edit button
- 4 key info cards: PM, Start Date, Est. Completion, Budget
- Project Information card (type, dept, status, orgs)
- Property & Units card with "View Property" button
- Budget overview with progress bar
- Team section
- Quick Actions (Schedule Walk, Add Observation, View Budget)

---

## 🧭 Navigation Structure

### Sidebar (`dashboard/layout.tsx`)
- Dashboard (/)
- Projects (/dashboard/projects)
- Calendar (placeholder)
- Documents (placeholder)
- Team (placeholder)
- Active page highlighted in blue

### Breadcrumb Navigation
- All pages have back buttons
- Logical parent → child flow:
  ```
  Dashboard → Projects → Project Details → Property → Walks → Walk Details
  ```

---

## 🌐 API Client (`lib/api.ts`)

```typescript
// All API functions with auth interceptors

export const authApi = { login, register }
export const usersApi = { getMe, getAll, getById }
export const projectsApi = { getAll, getById, create, update }
export const propertiesApi = { getAll, getById, getBuildings, getUnits }
export const walksApi = { getAll, getById, create, update, delete }
export const observationsApi = { getAll, getById, create, update, addComment, addPhoto }
export const unitTypesApi = { getAll, getById, create, update, uploadFloorPlan, setBuildingCount }
```

---

## 🎨 Styling Conventions

### Status Badge Colors
```
active    → green  (bg-green-100 text-green-700)
proposal  → yellow (bg-yellow-100 text-yellow-700)
lead      → blue   (bg-blue-100 text-blue-700)
on_hold   → orange (bg-orange-100 text-orange-700)
completed → purple (bg-purple-100 text-purple-700)
archived  → gray   (bg-gray-100 text-gray-700)
```

### Severity Colors
```
critical → text-red-600
major    → text-orange-600
minor    → text-yellow-600
cosmetic → text-blue-600
```

### Card Hover Effects
```css
hover:shadow-xl
hover:border-primary/20
transition-all duration-200
```

---

## ⚠️ Issues & Fixes

### Link Import Missing
**Problem:** `Cannot find module 'Link'`
**Fix:** Add `import Link from 'next/link'` to projects page

### Duplicate propertiesApi Declaration
**Problem:** Two `export const propertiesApi` in api.ts
**Fix:** Delete the second/duplicate block

### Wrong Projects Folder Location
**Problem:** Projects pages created outside dashboard folder
**Fix:** Move to `app/dashboard/projects/` for layout to apply

### View Property 404
**Problem:** Button linked to wrong path
**Fix:** Correct path is `app/dashboard/projects/[id]/property/page.tsx`
