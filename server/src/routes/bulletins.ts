import { Router } from 'express';
import { db } from '../db';
import { bulletins, bulletinReads, pushSubscriptions } from '../schema/bulletins';
import { residentUnits } from '../schema/residents';
import { requireAuth, requireRole, INTERNAL_ROLES, AuthRequest } from '../middleware/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import webpush from 'web-push';

const router = Router();

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@diligence.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ─── GET /api/bulletins ───────────────────────────────────────────────────────
// Returns bulletins for the current user:
//   - Residents: bulletins matching their property/building/unit, not archived
//   - PMs: all bulletins for a given property (via ?propertyId=)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role === 'resident') {
      // Find resident's unit
      const unit = await db.query.residentUnits.findFirst({
        where: and(eq(residentUnits.userId, user.id), eq(residentUnits.isActive, true)),
      });

      if (!unit) return res.json({ bulletins: [] });

      // Fetch bulletins for this property that aren't archived
      const all = await db.query.bulletins.findMany({
        where: and(
          eq(bulletins.propertyId, unit.propertyId),
          eq(bulletins.isArchived, false)
        ),
        with: { author: true, reads: true },
        orderBy: [desc(bulletins.createdAt)],
      });

      // Filter to bulletins targeting this resident specifically
      const visible = all.filter((b) => {
        if (b.targetType === 'all') return true;
        if (b.targetType === 'building' && unit.buildingId && b.targetBuildingId === unit.buildingId) return true;
        if (b.targetType === 'unit' && unit.unitNumber && b.targetUnitNumber === unit.unitNumber) return true;
        return false;
      });

      const withReadStatus = visible.map((b) => ({
        ...b,
        isRead: b.reads.some((r) => r.userId === user.id),
        reads: undefined,
      }));

      return res.json({ bulletins: withReadStatus });
    }

    // PM view — filter by property
    const { propertyId } = req.query;
    const all = await db.query.bulletins.findMany({
      where: propertyId ? eq(bulletins.propertyId, parseInt(propertyId as string)) : undefined,
      with: { author: true, reads: true },
      orderBy: [desc(bulletins.createdAt)],
    });

    res.json({ bulletins: all });
  } catch (error) {
    console.error('Get bulletins error:', error);
    res.status(500).json({ error: 'Failed to fetch bulletins' });
  }
});

// ─── POST /api/bulletins ──────────────────────────────────────────────────────
// PM creates a bulletin and optionally sends a push notification
router.post('/', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const { projectId, propertyId, title, body, category, targetType, targetBuildingId, targetUnitNumber, sendPush, scheduledDate } = req.body;

    if (!projectId || !propertyId || !title || !body) {
      return res.status(400).json({ error: 'projectId, propertyId, title, and body are required' });
    }

    const [bulletin] = await db.insert(bulletins).values({
      projectId,
      propertyId,
      title,
      body,
      category: category || 'general',
      targetType: targetType || 'all',
      targetBuildingId: targetBuildingId || null,
      targetUnitNumber: targetUnitNumber || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdBy: req.user!.id,
    }).returning();

    // Send push notifications if requested
    if (sendPush && process.env.VAPID_PUBLIC_KEY) {
      try {
        // Find all resident units for this property
        const residents = await db.query.residentUnits.findMany({
          where: and(
            eq(residentUnits.propertyId, propertyId),
            eq(residentUnits.isActive, true)
          ),
        });

        const residentUserIds = residents
          .filter((r) => {
            if (targetType === 'all') return true;
            if (targetType === 'building' && r.buildingId === targetBuildingId) return true;
            if (targetType === 'unit' && r.unitNumber === targetUnitNumber) return true;
            return false;
          })
          .map((r) => r.userId);

        if (residentUserIds.length > 0) {
          const subs = await db.query.pushSubscriptions.findMany({
            where: and(
              inArray(pushSubscriptions.userId, residentUserIds),
              eq(pushSubscriptions.isActive, true)
            ),
          });

          const payload = JSON.stringify({
            title,
            body: body.substring(0, 100),
            tag: `bulletin-${bulletin.id}`,
            url: '/resident/bulletins',
          });

          await Promise.allSettled(
            subs.map((sub) =>
              webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              ).catch(async (err) => {
                // Deactivate dead subscriptions (410 Gone)
                if (err.statusCode === 410) {
                  await db.update(pushSubscriptions)
                    .set({ isActive: false })
                    .where(eq(pushSubscriptions.id, sub.id));
                }
              })
            )
          );

          await db.update(bulletins)
            .set({ pushSent: true, pushSentAt: new Date() })
            .where(eq(bulletins.id, bulletin.id));
        }
      } catch (pushError) {
        console.error('Push notification error:', pushError);
      }
    }

    res.status(201).json({ bulletin });
  } catch (error) {
    console.error('Create bulletin error:', error);
    res.status(500).json({ error: 'Failed to create bulletin' });
  }
});

// ─── PATCH /api/bulletins/:id/read ───────────────────────────────────────────
// Resident marks a bulletin as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bulletinId = parseInt(req.params.id);
    const userId = req.user!.id;

    const existing = await db.query.bulletinReads.findFirst({
      where: and(eq(bulletinReads.bulletinId, bulletinId), eq(bulletinReads.userId, userId)),
    });

    if (!existing) {
      await db.insert(bulletinReads).values({ bulletinId, userId });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── PATCH /api/bulletins/:id/archive ────────────────────────────────────────
// PM archives a bulletin (removes it from resident feeds)
router.patch('/:id/archive', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    await db.update(bulletins)
      .set({ isArchived: true, archivedAt: new Date() })
      .where(eq(bulletins.id, parseInt(req.params.id)));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive bulletin' });
  }
});

// ─── DELETE /api/bulletins/:id ────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    await db.delete(bulletins).where(eq(bulletins.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bulletin' });
  }
});

export { router as bulletinsRouter };
