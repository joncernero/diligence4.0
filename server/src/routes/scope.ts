import { Router } from 'express';
import { db } from '../db';
import { projectScopeItems, constructionCodes, observationScopeLinks } from '../schema/scope';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/scope?projectId=1 - Get all scope items for a project
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const scopeItems = await db.query.projectScopeItems.findMany({
      where: eq(projectScopeItems.projectId, parseInt(projectId as string)),
      with: {
        csiCode: true,
        observationLinks: {
          with: {
            observation: {
              columns: { id: true, title: true, status: true },
            },
          },
        },
      },
      orderBy: [desc(projectScopeItems.createdAt)],
    });

    res.json({ scopeItems });
  } catch (error) {
    console.error('Get scope items error:', error);
    res.status(500).json({ error: 'Failed to fetch scope items' });
  }
});

// GET /api/scope/:id - Get single scope item
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const scopeItemId = parseInt(req.params.id);

    const scopeItem = await db.query.projectScopeItems.findFirst({
      where: eq(projectScopeItems.id, scopeItemId),
      with: {
        project: true,
        csiCode: true,
        materials: true,
        observationLinks: {
          with: {
            observation: true,
          },
        },
      },
    });

    if (!scopeItem) {
      return res.status(404).json({ error: 'Scope item not found' });
    }

    res.json({ scopeItem });
  } catch (error) {
    console.error('Get scope item error:', error);
    res.status(500).json({ error: 'Failed to fetch scope item' });
  }
});

// POST /api/scope - Create new scope item
router.post('/', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const {
      projectId,
      scopeName,
      description,
      csiCodeId,
      estimatedCost,
      status,
      appliesToUnitTypes,
      appliesToAllUnits,
      startDate,
      notes,
    } = req.body;

    if (!projectId || !scopeName) {
      return res.status(400).json({ error: 'Project ID and scope name are required' });
    }

    const [newScopeItem] = await db.insert(projectScopeItems).values({
      projectId,
      scopeName,
      description: description || null,
      csiCodeId: csiCodeId || null,
      estimatedCost: estimatedCost || null,
      status: status || 'planned',
      appliesToUnitTypes: appliesToUnitTypes || null,
      appliesToAllUnits: appliesToAllUnits || false,
      startDate: startDate ? new Date(startDate) : null,
      notes: notes || null,
      createdBy: req.user!.id,
    }).returning();

    res.status(201).json({
      message: 'Scope item created successfully',
      scopeItem: newScopeItem,
    });
  } catch (error) {
    console.error('Create scope item error:', error);
    res.status(500).json({ error: 'Failed to create scope item' });
  }
});

// PUT /api/scope/:id - Update scope item
router.put('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req, res) => {
  try {
    const scopeItemId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;

    const [updated] = await db.update(projectScopeItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projectScopeItems.id, scopeItemId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Scope item not found' });
    }

    res.json({
      message: 'Scope item updated successfully',
      scopeItem: updated,
    });
  } catch (error) {
    console.error('Update scope item error:', error);
    res.status(500).json({ error: 'Failed to update scope item' });
  }
});

// DELETE /api/scope/:id - Delete scope item
router.delete('/:id', requireAuth, requireRole(['admin', 'pm']), async (req, res) => {
  try {
    const scopeItemId = parseInt(req.params.id);

    await db.delete(projectScopeItems).where(eq(projectScopeItems.id, scopeItemId));

    res.json({ message: 'Scope item deleted successfully' });
  } catch (error) {
    console.error('Delete scope item error:', error);
    res.status(500).json({ error: 'Failed to delete scope item' });
  }
});

// POST /api/scope/:id/link-observation - Link observation to scope item
router.post('/:id/link-observation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const scopeItemId = parseInt(req.params.id);
    const { observationId, notes } = req.body;

    if (!observationId) {
      return res.status(400).json({ error: 'Observation ID is required' });
    }

    const [link] = await db.insert(observationScopeLinks).values({
      scopeItemId,
      observationId,
      notes: notes || null,
    }).returning();

    res.status(201).json({
      message: 'Observation linked successfully',
      link,
    });
  } catch (error) {
    console.error('Link observation error:', error);
    res.status(500).json({ error: 'Failed to link observation' });
  }
});

export { router as scopeRouter };
