import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { maintenanceRequests } from '../schema/maintenance';
import { residentUnits } from '../schema/residents';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { projects } from '../schema/projects';
import { uploadToR2, generateFileKey } from '../utils/r2Upload';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── RESIDENT ROUTES ───────────────────────────────────────────────────────────

// GET /api/maintenance - Resident: get own requests
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const whereClause = status
      ? and(
          eq(maintenanceRequests.residentId, req.user!.id),
          eq(maintenanceRequests.status, status as string),
        )
      : eq(maintenanceRequests.residentId, req.user!.id);

    const requests = await db.query.maintenanceRequests.findMany({
      where: whereClause,
      with: {
        assignee: { columns: { id: true, userFirst: true, userLast: true } },
      },
      orderBy: [desc(maintenanceRequests.createdAt)],
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// GET /api/maintenance/all - Staff: get all requests for org (pm/admin/super only)
router.get('/all', requireAuth, requireRole(['admin', 'pm', 'super', 'pe']), async (req: AuthRequest, res) => {
  try {
    const { status, propertyId, projectId } = req.query;

    // Scope to org via projects
    const orgProjects = await db.query.projects.findMany({
      where: eq(projects.orgId, req.user!.orgId!),
      columns: { id: true },
    });
    const orgProjectIds = orgProjects.map(p => p.id);

    if (orgProjectIds.length === 0) {
      return res.json({ requests: [] });
    }

    let requests = await db.query.maintenanceRequests.findMany({
      where: and(
        eq(maintenanceRequests.orgId, req.user!.orgId!),
        status ? eq(maintenanceRequests.status, status as string) : undefined,
        propertyId ? eq(maintenanceRequests.propertyId, parseInt(propertyId as string)) : undefined,
        projectId ? eq(maintenanceRequests.projectId, parseInt(projectId as string)) : undefined,
      ),
      with: {
        resident: { columns: { id: true, userFirst: true, userLast: true, userEmail: true } },
        assignee: { columns: { id: true, userFirst: true, userLast: true } },
      },
      orderBy: [desc(maintenanceRequests.createdAt)],
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get all maintenance requests error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// POST /api/maintenance - Resident: submit a new request
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    // Look up the resident's unit assignment
    const residentUnit = await db.query.residentUnits.findFirst({
      where: and(
        eq(residentUnits.userId, req.user!.id),
        eq(residentUnits.isActive, true),
      ),
    });

    if (!residentUnit) {
      return res.status(400).json({ error: 'No active unit assignment found for this resident' });
    }

    // Determine orgId from the project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, residentUnit.projectId),
      columns: { orgId: true },
    });

    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    const [newRequest] = await db
      .insert(maintenanceRequests)
      .values({
        orgId: project.orgId,
        residentId: req.user!.id,
        propertyId: residentUnit.propertyId,
        projectId: residentUnit.projectId,
        unitNumber: residentUnit.unitNumber || undefined,
        title,
        description,
        category,
        priority: priority || 'medium',
        status: 'submitted',
        photos: [],
      })
      .returning();

    res.status(201).json({
      message: 'Maintenance request submitted successfully',
      request: newRequest,
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ error: 'Failed to submit maintenance request' });
  }
});

// POST /api/maintenance/:id/photos - Upload photo to R2
router.post('/:id/photos', requireAuth, upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    // Verify ownership
    const maintenanceReq = await db.query.maintenanceRequests.findFirst({
      where: and(
        eq(maintenanceRequests.id, requestId),
        eq(maintenanceRequests.residentId, req.user!.id),
      ),
    });

    if (!maintenanceReq) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    const fileKey = `maintenance/${generateFileKey(file.originalname)}`;
    const { url, key } = await uploadToR2(file.buffer, fileKey, file.mimetype);

    const currentPhotos = (maintenanceReq.photos as any[]) || [];
    const newPhoto = {
      url,
      key,
      fileName: file.originalname,
      caption: req.body.caption || null,
      uploadedAt: new Date().toISOString(),
    };

    await db
      .update(maintenanceRequests)
      .set({ photos: [...currentPhotos, newPhoto], updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, requestId));

    res.status(201).json({ message: 'Photo uploaded successfully', photo: newPhoto });
  } catch (error) {
    console.error('Maintenance photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// PUT /api/maintenance/:id - Staff: update status/notes/assignment
router.put('/:id', requireAuth, requireRole(['admin', 'pm', 'super', 'pe', 'pc']), async (req: AuthRequest, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status, staffNotes, assignedTo } = req.body;

    const existing = await db.query.maintenanceRequests.findFirst({
      where: and(
        eq(maintenanceRequests.id, requestId),
        eq(maintenanceRequests.orgId, req.user!.orgId!),
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    const setValues: Partial<typeof maintenanceRequests.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (status) {
      setValues.status = status;
      if (status === 'acknowledged' && !existing.acknowledgedAt) {
        setValues.acknowledgedAt = new Date();
      }
      if (status === 'completed' && !existing.completedAt) {
        setValues.completedAt = new Date();
      }
    }
    if (staffNotes !== undefined) setValues.staffNotes = staffNotes;
    if (assignedTo !== undefined) setValues.assignedTo = assignedTo || null;

    const [updated] = await db
      .update(maintenanceRequests)
      .set(setValues)
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    res.json({ message: 'Request updated successfully', request: updated });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

export { router as maintenanceRouter };
