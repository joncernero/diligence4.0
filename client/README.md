# Construction PM - Frontend

Next.js 15 + TypeScript + Tailwind CSS

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

The `.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Start Development Server
```bash
npm run dev
```

Frontend runs on http://localhost:3000

---

## 📚 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Run production server
npm run lint       # Run ESLint
```

---

## 🔐 Test Login

**Make sure your backend is running first!**

```bash
# In another terminal:
cd ../server
npm run dev
```

Then visit http://localhost:3000 and login with:

```
Email: pm@acme.com
Password: password123
```

Or any of these:
- admin@acme.com
- pe@acme.com
- pc@acme.com
- super@acme.com

(All use password: password123)

---

## 📁 Project Structure

```
client/
├── app/
│   ├── login/              # Login page
│   ├── dashboard/          # Dashboard (protected)
│   │   ├── layout.tsx      # Sidebar navigation
│   │   └── page.tsx        # Dashboard home
│   ├── projects/           # Projects list
│   │   └── page.tsx
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # React Query provider
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # UI components (Shadcn-style)
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── api.ts              # API client (axios)
│   ├── auth.ts             # Auth state (Zustand)
│   └── utils.ts            # Utility functions
└── package.json
```

---

## 🎨 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management (auth)
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Shadcn/ui** - Component library

---

## 🔌 API Integration

The frontend connects to your Express backend via `lib/api.ts`:

```typescript
// Automatically adds JWT token to requests
const response = await projectsApi.getAll();
```

Available API functions:
- `authApi.login(email, password)`
- `authApi.register(data)`
- `usersApi.getMe()`
- `usersApi.getAll()`
- `projectsApi.getAll()`
- `projectsApi.create(data)`

---

## 🛡️ Authentication Flow

1. User logs in at `/login`
2. JWT token stored in localStorage
3. Token automatically added to API requests
4. Protected routes check authentication
5. Redirect to login if not authenticated

```typescript
// Auth state (Zustand)
const { isAuthenticated, user, login, logout } = useAuth();
```

---

## 📄 Pages

### ✅ Implemented:
- `/` - Home (redirects to login/dashboard)
- `/login` - Login page
- `/dashboard` - Dashboard with stats
- `/projects` - Projects list

### 🔨 Coming Soon:
- `/projects/[id]` - Project details
- `/projects/new` - Create project
- `/calendar` - Calendar view
- `/documents` - Document management
- `/team` - Team members

---

## 🎨 UI Components

Built with Shadcn/ui principles:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

<Button variant="default">Click me</Button>
<Card>Content here</Card>
<Input type="email" placeholder="Email" />
```

---

## 🔧 Customization

### Colors

Edit `tailwind.config.ts` for custom colors:

```typescript
colors: {
  primary: { ... },
  secondary: { ... },
}
```

### Adding New Pages

1. Create folder in `app/`
2. Add `page.tsx`
3. Optionally add `layout.tsx`

Example:
```bash
mkdir app/calendar
touch app/calendar/page.tsx
```

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Use different port
PORT=3001 npm run dev
```

**API connection failed:**
- Make sure backend is running on port 4000
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify no CORS errors in browser console

**Login not working:**
- Verify backend is running
- Check credentials (pm@acme.com / password123)
- Open browser DevTools → Network tab to see API requests

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Responsive Design

All pages are mobile-responsive using Tailwind's responsive utilities:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 col mobile, 2 tablet, 4 desktop */}
</div>
```

---

## 🚀 Next Steps

1. ✅ Get frontend running
2. ✅ Test login
3. ✅ View dashboard
4. 🔨 Add project creation form
5. 🔨 Add calendar page
6. 🔨 Add property walks
7. 🔨 Add observations

---

## 💡 Tips

- Use React Query for all API calls (automatic caching!)
- Auth state persists in localStorage
- Protected routes automatically redirect to login
- Sidebar navigation shows current page
- All forms use controlled components

---

## 📞 Need Help?

Check:
1. Browser console for errors
2. Network tab for failed API requests
3. Backend terminal for API errors
4. Frontend terminal for build errors

---

## ✅ Ready!

Your frontend is ready to connect to the backend. Start both servers and you'll have a working full-stack app!

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

Visit http://localhost:3000 🎉
