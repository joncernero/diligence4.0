import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { unitTypeTemplates, buildingUnitCounts } from '../schema/unitTypes';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { uploadToR2, generateFileKey } from '../utils/r2Upload';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// GET /api/unit-types?propertyId=1 - Get all unit types for a property
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const unitTypes = await db.query.unitTypeTemplates.findMany({
      where: eq(unitTypeTemplates.propertyId, parseInt(propertyId as string)),
      with: {
        buildingCounts: true,
      },
    });

    res.json({ unitTypes });
  } catch (error) {
    console.error('Get unit types error:', error);
    res.status(500).json({ error: 'Failed to fetch unit types' });
  }
});

// GET /api/unit-types/:id - Get single unit type
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const unitTypeId = parseInt(req.params.id);

    const unitType = await db.query.unitTypeTemplates.findFirst({
      where: eq(unitTypeTemplates.id, unitTypeId),
      with: {
        property: true,
        buildingCounts: true,
      },
    });

    if (!unitType) {
      return res.status(404).json({ error: 'Unit type not found' });
    }

    res.json({ unitType });
  } catch (error) {
    console.error('Get unit type error:', error);
    res.status(500).json({ error: 'Failed to fetch unit type' });
  }
});

// POST /api/unit-types - Create new unit type
router.post('/', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const {
      propertyId,
      typeName,
      bedrooms,
      bathrooms,
      squareFootage,
      finishes,
      amenities,
      notes,
    } = req.body;

    if (!propertyId || !typeName || bedrooms === undefined || bathrooms === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newUnitType] = await db.insert(unitTypeTemplates).values({
      propertyId,
      typeName,
      bedrooms,
      bathrooms,
      squareFootage: squareFootage || null,
      finishes: finishes || null,
      amenities: amenities || null,
      notes: notes || null,
    }).returning();

    res.status(201).json({
      message: 'Unit type created successfully',
      unitType: newUnitType,
    });
  } catch (error) {
    console.error('Create unit type error:', error);
    res.status(500).json({ error: 'Failed to create unit type' });
  }
});

// POST /api/unit-types/:id/floor-plan - Upload floor plan
router.post('/:id/floor-plan', requireAuth, upload.single('floorPlan'), async (req: AuthRequest, res) => {
  try {
    const unitTypeId = parseInt(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate key and upload to R2
    const fileKey = generateFileKey(file.originalname, 'floor-plans');
    const { url, key } = await uploadToR2(file.buffer, fileKey, file.mimetype);

    // Update unit type with floor plan
    const [updated] = await db.update(unitTypeTemplates)
      .set({
        floorPlanUrl: url,
        floorPlanKey: key,
        updatedAt: new Date(),
      })
      .where(eq(unitTypeTemplates.id, unitTypeId))
      .returning();

    res.json({
      message: 'Floor plan uploaded successfully',
      unitType: updated,
    });
  } catch (error) {
    console.error('Upload floor plan error:', error);
    res.status(500).json({ error: 'Failed to upload floor plan' });
  }
});

// PUT /api/unit-types/:id - Update unit type
router.put('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req, res) => {
  try {
    const unitTypeId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.createdAt;

    const [updated] = await db.update(unitTypeTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(unitTypeTemplates.id, unitTypeId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Unit type not found' });
    }

    res.json({
      message: 'Unit type updated successfully',
      unitType: updated,
    });
  } catch (error) {
    console.error('Update unit type error:', error);
    res.status(500).json({ error: 'Failed to update unit type' });
  }
});

// POST /api/unit-types/:id/building-counts - Set unit counts for a building
router.post('/:id/building-counts', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const unitTypeId = parseInt(req.params.id);
    const { buildingId, count } = req.body;

    if (!buildingId || count === undefined) {
      return res.status(400).json({ error: 'Building ID and count are required' });
    }

    // Check if record exists
    const existing = await db.query.buildingUnitCounts.findFirst({
      where: and(
        eq(buildingUnitCounts.buildingId, buildingId),
        eq(buildingUnitCounts.unitTypeId, unitTypeId)
      ),
    });

    let result;
    if (existing) {
      // Update existing
      [result] = await db.update(buildingUnitCounts)
        .set({ count, updatedAt: new Date() })
        .where(eq(buildingUnitCounts.id, existing.id))
        .returning();
    } else {
      // Insert new
      [result] = await db.insert(buildingUnitCounts)
        .values({ buildingId, unitTypeId, count })
        .returning();
    }

    res.json({
      message: 'Building count updated successfully',
      buildingCount: result,
    });
  } catch (error) {
    console.error('Update building count error:', error);
    res.status(500).json({ error: 'Failed to update building count' });
  }
});

export { router as unitTypesRouter };
