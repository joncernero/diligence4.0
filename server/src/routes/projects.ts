import { Router } from 'express';
import { db } from '../db';
import { projects } from '../schema/projects';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';

const router = Router();

// GET /api/projects - Get all projects for the requesting org
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.orgId, req.user!.orgId!),
      with: {
        projectManager: {
          columns: {
            id: true,
            userFirst: true,
            userLast: true,
            userEmail: true,
          },
        },
        organization: {
          columns: {
            id: true,
            orgName: true,
          },
        },
      },
    });

    res.json({ projects: allProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get project by ID (org-scoped)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.orgId, req.user!.orgId!),
      ),
      with: {
        property: true,
        projectManager: true,
        organization: true,
        gcOrg: true,
        clientOrg: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project (PM or Admin only)
router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'pm']),
  async (req: AuthRequest, res) => {
    try {
      const {
        projectName,
        projectNumber,
        projectType,
        projectStatus,
        projectDepartment,
        propertyId,
        projectManagerId,
        gcOrgId,
        clientOrgId,
        startDate,
        estimatedCompletion,
        totalBudget,
      } = req.body;

      if (!projectName || !projectStatus) {
        return res
          .status(400)
          .json({ error: 'Project name and status are required' });
      }

      const [newProject] = await db
        .insert(projects)
        .values({
          orgId: req.user!.orgId!, // User's organization
          projectName,
          projectNumber: projectNumber || null,
          projectType: projectType || null,
          projectStatus,
          projectDepartment: projectDepartment || null,
          propertyId: propertyId || null,
          projectManagerId: projectManagerId || req.user!.id,
          gcOrgId: gcOrgId || null,
          clientOrgId: clientOrgId || null,
          startDate: startDate || null,
          estimatedCompletion: estimatedCompletion || null,
          totalBudget: totalBudget || null,
          createdBy: req.user!.id,
        })
        .returning();

      res.status(201).json({
        message: 'Project created successfully',
        project: newProject,
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },
);

// PUT /api/projects/:id - Update project (org-scoped)
router.put(
  '/:id',
  requireAuth,
  requireRole(['admin', 'pm']),
  async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      // Remove fields that shouldn't be updated
      delete updates.id;
      delete updates.createdAt;
      delete updates.updatedAt;
      delete updates.organizationId; // Don't allow changing org
      delete updates.property; // Don't send the whole property object
      delete updates.projectManager; // Don't send the whole user object
      delete updates.superintendent; // Don't send the whole user object

      // Only allow valid project fields
      const allowedFields = {
        projectName: updates.projectName,
        projectNumber: updates.projectNumber,
        propertyId: updates.propertyId,
        projectManagerId: updates.projectManagerId,
        superintendentId: updates.superintendentId,
        status: updates.status,
        startDate: updates.startDate || null, // ← Keep as string or null
        endDate: updates.endDate || null, // ← Keep as string or null
        budget: updates.budget,
        description: updates.description,
      };

      const [updated] = await db
        .update(projects)
        .set({
          ...allowedFields,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, projectId), eq(projects.orgId, req.user!.orgId!)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        message: 'Project updated successfully',
        project: updated,
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },
);

export { router as projectsRouter };
