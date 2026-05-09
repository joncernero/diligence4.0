import { Router } from 'express';
import { db } from '../db';
import {
  notifications,
  notificationPreferences,
} from '../schema/notifications';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../utils/notifications';

const router = Router();

// GET /api/notifications - Get user's notifications
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { unreadOnly } = req.query;
    const userId = req.user!.id;

    let whereConditions: any[] = [eq(notifications.userId, userId)];

    if (unreadOnly === 'true') {
      whereConditions.push(eq(notifications.isRead, false));
    }

    const userNotifications = await db.query.notifications.findMany({
      where: and(...whereConditions),
      orderBy: [desc(notifications.createdAt)],
      limit: 50, // Limit to recent 50
    });

    // Get unread count
    const unreadCount = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    });

    res.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Verify notification belongs to user
    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await markNotificationAsRead(notificationId);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await markAllNotificationsAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// GET /api/notifications/preferences - Get user's notification preferences
router.get('/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // Create default preferences if none exist
    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({
          userId,
        })
        .returning();
    }

    res.json({ preferences: prefs });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    delete updates.id;
    delete updates.userId;

    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    if (!updated) {
      // Create if doesn't exist
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...updates,
        })
        .returning();
      return res.json({ preferences: created });
    }

    res.json({ preferences: updated });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export { router as notificationsRouter };
