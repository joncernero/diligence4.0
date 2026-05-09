import { Router } from 'express';
import { db } from '../db';
import { properties, buildings } from '../schema/properties';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/properties - Get all properties for the requesting org
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allProperties = await db.query.properties.findMany({
      where: eq(properties.orgId, req.user!.orgId!),
      with: {
        buildings: true,
      },
      orderBy: [desc(properties.createdAt)],
    });

    res.json({ properties: allProperties });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET /api/properties/:id - Get single property (org-scoped)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, propertyId),
        eq(properties.orgId, req.user!.orgId!),
      ),
      with: {
        buildings: {
          orderBy: [buildings.buildingNumber],
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// POST /api/properties - Create new property
router.post('/', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const {
      propName,
      propAddress,
      propCity,
      propState,
      propZip,
      propType,
      totalBuildings,
      totalUnits,
    } = req.body;

    if (!propName) {
      return res.status(400).json({ error: 'Property name is required' });
    }

    const [newProperty] = await db.insert(properties).values({
      orgId: req.user!.orgId!,
      propName,
      propAddress: propAddress || null,
      propCity: propCity || null,
      propState: propState || null,
      propZip: propZip || null,
      propType: propType || 'multifamily',
      totalBuildings: totalBuildings || null,
      totalUnits: totalUnits || null,
    }).returning();

    res.status(201).json({
      message: 'Property created successfully',
      property: newProperty,
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT /api/properties/:id - Update property (org-scoped)
router.put('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.orgId;    // Never allow changing org
    delete updates.createdAt;

    const [updated] = await db.update(properties)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(properties.id, propertyId), eq(properties.orgId, req.user!.orgId!)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({
      message: 'Property updated successfully',
      property: updated,
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/properties/:id - Delete property (org-scoped)
router.delete('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Check if property has associated projects
    const { projects } = await import('../schema/projects');
    const associatedProjects = await db.query.projects.findMany({
      where: eq(projects.propertyId, propertyId),
    });

    if (associatedProjects && associatedProjects.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete property with associated projects. Delete projects first.' 
      });
    }

    await db.delete(properties).where(
      and(eq(properties.id, propertyId), eq(properties.orgId, req.user!.orgId!))
    );

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export { router as propertiesRouter };
