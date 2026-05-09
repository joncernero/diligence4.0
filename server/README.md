# Construction PM - Backend API

Node.js + Express + Drizzle ORM + PostgreSQL

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Neon database URL:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/main?sslmode=require"
```

### 3. Push Schema to Database
```bash
npm run db:push
```

This creates all your tables in the database.

### 4. Seed Test Data
```bash
npm run seed
```

This creates:
- 1 organization (Acme Construction Company)
- 5 test users (admin, pm, pe, pc, super)
- 1 property with 3 buildings
- 2 sample projects

### 5. Start Development Server
```bash
npm run dev
```

Server runs on http://localhost:4000

---

## 📚 Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm start          # Run production server
npm run db:push    # Push schema changes to database
npm run db:studio  # Open Drizzle Studio (GUI for database)
npm run seed       # Populate database with test data
```

---

## 🔐 Test Login Credentials

After running `npm run seed`:

```
Email: admin@acme.com
Password: password123

Email: pm@acme.com
Password: password123

Email: pe@acme.com
Password: password123

(All users have password: password123)
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login and get JWT token
```

### Users
```
GET    /api/users            # Get all users (admin only)
GET    /api/users/me         # Get current user
GET    /api/users/:id        # Get user by ID
```

### Projects
```
GET    /api/projects         # Get all projects
GET    /api/projects/:id     # Get project by ID
POST   /api/projects         # Create project (PM/admin only)
PUT    /api/projects/:id     # Update project (PM/admin only)
```

---

## 🗄️ Database Schema

### Core Tables Created:
- ✅ organizations
- ✅ users (with PE/PC roles & departments)
- ✅ user_project_access
- ✅ projects
- ✅ properties
- ✅ buildings
- ✅ units

### User Roles:
- `admin` - System administrator
- `pm` - Project Manager
- `super` - Superintendent
- `pe` - Project Engineer ⭐ NEW
- `pc` - Project Coordinator ⭐ NEW
- `gc` - General Contractor
- `sub` - Subcontractor
- `client_view` - Client (view-only)

### Departments:
- `new_construction`
- `redevelopment`
- `exteriors`
- `finance`

---

## 🔍 Testing the API

### Using curl:

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pm@acme.com","password":"password123"}'
```

**Get Projects (with token):**
```bash
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman/Insomnia:

1. Import endpoints from above
2. POST to `/api/auth/login` to get token
3. Add token to Authorization header: `Bearer YOUR_TOKEN`
4. Test other endpoints

---

## 🛠️ Database Management

### View Your Data (Drizzle Studio):
```bash
npm run db:studio
```

Opens a GUI at http://localhost:4983 where you can:
- Browse all tables
- Edit data
- Run queries

### Push Schema Changes:
```bash
npm run db:push
```

Use this when you modify schema files.

---

## 📁 Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── seed.ts           # Test data seeder
│   ├── schema/
│   │   ├── users.ts          # Users & orgs tables
│   │   ├── projects.ts       # Projects table
│   │   └── properties.ts     # Properties, buildings, units
│   ├── routes/
│   │   ├── auth.ts           # Login/register endpoints
│   │   ├── users.ts          # User CRUD
│   │   └── projects.ts       # Project CRUD
│   ├── middleware/
│   │   └── auth.ts           # JWT verification
│   └── server.ts             # Express app entry point
├── drizzle/                  # Migration files (auto-generated)
├── package.json
├── tsconfig.json
└── .env                      # Your secrets (not committed)
```

---

## 🔧 Next Steps

1. ✅ Get backend running
2. ✅ Test with Drizzle Studio
3. ✅ Test API endpoints with Postman
4. 🔨 Add more tables (calendar, observations, etc.)
5. 🔨 Set up frontend
6. 🔨 Connect frontend to backend

---

## ❓ Troubleshooting

**Port already in use:**
```bash
# Kill process on port 4000
lsof -i :4000
kill -9 <PID>

# Or use different port in .env
PORT=4001
```

**Database connection error:**
- Check DATABASE_URL in .env
- Verify Neon database is accessible
- Ensure no quotes around the connection string

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Need Help?

If you get stuck, check:
1. Terminal error messages
2. Network tab in browser (for API calls)
3. Drizzle Studio to verify database state
