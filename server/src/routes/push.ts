import { Router } from 'express';
import { db } from '../db';
import { pushSubscriptions } from '../schema/bulletins';
import { notifications } from '../schema/notifications';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';
import webpush from 'web-push';

const router = Router();

// ─── GET /api/push/vapid-public-key ──────────────────────────────────────────
// Client fetches this to subscribe to push notifications
router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(503).json({ error: 'Push notifications not configured' });
  res.json({ publicKey: key });
});

// ─── POST /api/push/subscribe ─────────────────────────────────────────────────
// Client sends its PushSubscription object after user grants permission
router.post('/subscribe', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { endpoint, keys } = req.body;
    const { p256dh, auth } = keys || {};

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'endpoint, keys.p256dh, and keys.auth are required' });
    }

    const userId = req.user!.id;

    // Upsert — replace any existing subscription from this endpoint
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)),
    });

    if (existing) {
      await db.update(pushSubscriptions)
        .set({ p256dh, auth, isActive: true, lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh, auth });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// ─── DELETE /api/push/unsubscribe ─────────────────────────────────────────────
router.delete('/unsubscribe', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { endpoint } = req.body;
    await db.update(pushSubscriptions)
      .set({ isActive: false })
      .where(and(
        eq(pushSubscriptions.userId, req.user!.id),
        eq(pushSubscriptions.endpoint, endpoint)
      ));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// ─── PATCH /api/push/notifications/:id/clear ─────────────────────────────────
// User clears (hides) a notification from their inbox
router.patch('/notifications/:id/clear', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.update(notifications)
      .set({ isCleared: true, clearedAt: new Date() })
      .where(and(
        eq(notifications.id, parseInt(req.params.id)),
        eq(notifications.userId, req.user!.id)
      ));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notification' });
  }
});

// ─── PATCH /api/push/notifications/clear-all ─────────────────────────────────
// Clear all read notifications for the user
router.patch('/notifications/clear-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { and: drizzleAnd, eq: drizzleEq } = await import('drizzle-orm');
    await db.update(notifications)
      .set({ isCleared: true, clearedAt: new Date() })
      .where(and(
        eq(notifications.userId, req.user!.id),
        eq(notifications.isRead, true),
        eq(notifications.isCleared, false)
      ));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export { router as pushRouter };
