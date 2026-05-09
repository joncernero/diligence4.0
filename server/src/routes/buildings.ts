import { Router } from 'express';
import { db } from '../db';
import { buildings } from '../schema/properties';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';

const router = Router();

// GET /api/buildings?propertyId=1 - Get buildings for a property
router.get('/', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.query;

    const whereClause = propertyId 
      ? eq(buildings.propertyId, parseInt(propertyId as string))
      : undefined;

    const allBuildings = await db.query.buildings.findMany({
      where: whereClause,
      orderBy: [buildings.buildingNumber],
    });

    res.json({ buildings: allBuildings });
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// POST /api/buildings - Create new building
router.post('/', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const {
      propertyId,
      buildingNumber,
      buildingName,
      floors,
      unitsPerFloor,
      totalUnits,
      squareFootage,
    } = req.body;

    if (!propertyId || !buildingNumber) {
      return res.status(400).json({ error: 'Property ID and building number are required' });
    }

    const [newBuilding] = await db.insert(buildings).values({
      propertyId,
      buildingNumber,
      buildingName: buildingName || null,
      floors: floors || null,
      totalUnits: totalUnits || null,
      squareFootage: squareFootage || null,
    }).returning();

    res.status(201).json({
      message: 'Building created successfully',
      building: newBuilding,
    });
  } catch (error) {
    console.error('Create building error:', error);
    res.status(500).json({ error: 'Failed to create building' });
  }
});

// PUT /api/buildings/:id - Update building
router.put('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req, res) => {
  try {
    const buildingId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.propertyId; // Don't allow changing property
    delete updates.createdAt;

    const [updated] = await db.update(buildings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(buildings.id, buildingId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Building not found' });
    }

    res.json({
      message: 'Building updated successfully',
      building: updated,
    });
  } catch (error) {
    console.error('Update building error:', error);
    res.status(500).json({ error: 'Failed to update building' });
  }
});

// DELETE /api/buildings/:id - Delete building
router.delete('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req, res) => {
  try {
    const buildingId = parseInt(req.params.id);

    await db.delete(buildings).where(eq(buildings.id, buildingId));

    res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Delete building error:', error);
    res.status(500).json({ error: 'Failed to delete building' });
  }
});

export { router as buildingsRouter };
