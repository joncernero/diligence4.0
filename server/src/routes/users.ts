import { Router } from 'express';
import { db } from '../db';
import { users } from '../schema/users';
import { requireAuth, requireRole, INTERNAL_ROLES, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';

const router = Router();

// GET /api/users - Get all users within the requesting org
router.get('/', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const allUsers = await db.query.users.findMany({
      where: eq(users.orgId, req.user!.orgId!),
      columns: {
        id: true,
        userEmail: true,
        userFirst: true,
        userLast: true,
        userRole: true,
        userDepartment: true,
        orgId: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ users: allUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/me - Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
      columns: {
        id: true,
        userEmail: true,
        userFirst: true,
        userLast: true,
        userPhone: true,
        userRole: true,
        userDepartment: true,
        orgId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/:id - Get user by ID (org-scoped)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.orgId, req.user!.orgId!)),
      columns: {
        id: true,
        userEmail: true,
        userFirst: true,
        userLast: true,
        userPhone: true,
        userRole: true,
        userDepartment: true,
        orgId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export { router as usersRouter };
