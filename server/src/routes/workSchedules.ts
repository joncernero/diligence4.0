import { Router } from 'express';
import { db } from '../db';
import { workSchedules } from '../schema/schedule';
import { requireAuth, requireRole, INTERNAL_ROLES, AuthRequest } from '../middleware/auth';
import { eq, and, gte, lte } from 'drizzle-orm';

const router = Router();

// GET /api/work-schedules — list (filter by projectId, propertyId, buildingId)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, propertyId, buildingId, startDate, endDate } = req.query;

    let where;
    if (projectId) {
      where = eq(workSchedules.projectId, parseInt(projectId as string));
    } else if (propertyId) {
      where = eq(workSchedules.propertyId, parseInt(propertyId as string));
    }

    const schedules = await db.query.workSchedules.findMany({
      where,
      with: {
        project: { columns: { id: true, projectName: true } },
        property: { columns: { id: true, propName: true } },
        creator: { columns: { id: true, userFirst: true, userLast: true } },
      },
      orderBy: (ws, { asc }) => [asc(ws.startDate)],
    });

    res.json({ schedules });
  } catch (error) {
    console.error('Get work schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch work schedules' });
  }
});

// GET /api/work-schedules/resident — resident-visible events for a property/building/unit
router.get('/resident', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { propertyId, buildingId, unitNumber } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const schedules = await db.query.workSchedules.findMany({
      where: and(
        eq(workSchedules.propertyId, parseInt(propertyId as string)),
        eq(workSchedules.notifyResidents, true),
      ),
      with: {
        project: { columns: { id: true, projectName: true } },
      },
      orderBy: (ws, { asc }) => [asc(ws.startDate)],
    });

    // Filter by building/unit if specified (unit numbers are stored in jsonb array)
    let filtered = schedules;
    if (unitNumber) {
      filtered = schedules.filter((s: any) => {
        if (!s.buildingId && !s.unitNumbers) return true; // property-wide event
        if (buildingId && s.buildingId && s.buildingId !== parseInt(buildingId as string)) return false;
        if (s.unitNumbers && Array.isArray(s.unitNumbers)) {
          return s.unitNumbers.includes(unitNumber as string);
        }
        return true;
      });
    } else if (buildingId) {
      filtered = schedules.filter((s: any) => {
        if (!s.buildingId) return true; // property-wide
        return s.buildingId === parseInt(buildingId as string);
      });
    }

    res.json({ schedules: filtered });
  } catch (error) {
    console.error('Get resident schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// GET /api/work-schedules/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const schedule = await db.query.workSchedules.findFirst({
      where: eq(workSchedules.id, parseInt(req.params.id)),
      with: {
        project: true,
        property: true,
        creator: { columns: { id: true, userFirst: true, userLast: true } },
      },
    });

    if (!schedule) return res.status(404).json({ error: 'Work schedule not found' });
    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work schedule' });
  }
});

// POST /api/work-schedules
router.post('/', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const {
      projectId, propertyId, buildingId,
      title, tradeType, contractor,
      areaDescription, unitNumbers,
      startDate, endDate,
      notifyResidents, notes,
    } = req.body;

    if (!projectId || !propertyId || !title || !tradeType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newSchedule] = await db.insert(workSchedules).values({
      projectId,
      propertyId,
      buildingId: buildingId || null,
      title,
      tradeType,
      contractor: contractor || null,
      areaDescription: areaDescription || null,
      unitNumbers: unitNumbers || null,
      startDate,
      endDate,
      notifyResidents: notifyResidents !== false,
      notes: notes || null,
      createdBy: req.user!.id,
    }).returning();

    res.status(201).json({ message: 'Work schedule created', schedule: newSchedule });
  } catch (error) {
    console.error('Create work schedule error:', error);
    res.status(500).json({ error: 'Failed to create work schedule' });
  }
});

// PUT /api/work-schedules/:id
router.put('/:id', requireAuth, requireRole(INTERNAL_ROLES), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body };
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;

    const [updated] = await db
      .update(workSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workSchedules.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Work schedule not found' });
    res.json({ message: 'Updated', schedule: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update work schedule' });
  }
});

// DELETE /api/work-schedules/:id
router.delete('/:id', requireAuth, requireRole(INTERNAL_ROLES), async (req, res) => {
  try {
    await db.delete(workSchedules).where(eq(workSchedules.id, parseInt(req.params.id)));
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete work schedule' });
  }
});

export { router as workSchedulesRouter };
