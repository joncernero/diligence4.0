import { Router } from 'express';
import { db } from '../db';
import { constructionCodes } from '../schema/scope';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, or, like } from 'drizzle-orm';
import { allCsiCodes } from '../data/csiCodes';

const router = Router();

// GET /api/csi-codes - Get all CSI codes (with optional filter)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { formatVersion, search } = req.query;

    let whereClause;
    if (formatVersion) {
      whereClause = eq(constructionCodes.formatVersion, formatVersion as string);
    }

    const codes = await db.query.constructionCodes.findMany({
      where: whereClause,
    });

    // Filter by search if provided
    let filteredCodes = codes;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredCodes = codes.filter(
        (code) =>
          code.code.toLowerCase().includes(searchLower) ||
          code.title.toLowerCase().includes(searchLower) ||
          code.divisionTitle?.toLowerCase().includes(searchLower)
      );
    }

    res.json({ codes: filteredCodes });
  } catch (error) {
    console.error('Get CSI codes error:', error);
    res.status(500).json({ error: 'Failed to fetch CSI codes' });
  }
});

// POST /api/csi-codes/seed - Seed database with CSI codes (admin only)
router.post('/seed', requireAuth, requireRole(['admin', 'super']), async (req, res) => {
  try {
    // Check if codes already exist
    const existing = await db.query.constructionCodes.findMany();

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'CSI codes already seeded',
        count: existing.length,
      });
    }

    // Insert all codes
    const inserted = await db.insert(constructionCodes).values(allCsiCodes).returning();

    res.status(201).json({
      message: 'CSI codes seeded successfully',
      count: inserted.length,
    });
  } catch (error) {
    console.error('Seed CSI codes error:', error);
    res.status(500).json({ error: 'Failed to seed CSI codes' });
  }
});

export { router as csiCodesRouter };
