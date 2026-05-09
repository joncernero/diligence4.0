import { Router } from 'express';
import { db } from '../db';
import { projectTasks } from '../schema/tasks';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { eq, and, desc, gte, lte, between } from 'drizzle-orm';

const router = Router();

// GET /api/tasks - Get all tasks scoped to the requesting org (optionally filtered by project/date)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    // Resolve the set of project IDs that belong to this org
    const { projects } = await import('../schema/projects');
    let orgProjectIds: number[];

    if (projectId) {
      // Verify the supplied project belongs to the org
      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.id, parseInt(projectId as string)),
          eq(projects.orgId, req.user!.orgId!),
        ),
        columns: { id: true },
      });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      orgProjectIds = [project.id];
    } else {
      const orgProjects = await db.query.projects.findMany({
        where: eq(projects.orgId, req.user!.orgId!),
        columns: { id: true },
      });
      orgProjectIds = orgProjects.map(p => p.id);
    }

    const { inArray } = await import('drizzle-orm');
    let whereConditions: any[] = [
      orgProjectIds.length > 0
        ? inArray(projectTasks.projectId, orgProjectIds)
        : eq(projectTasks.projectId, -1), // No projects → no results
    ];

    if (startDate && endDate) {
      whereConditions.push(
        between(
          projectTasks.scheduledDate,
          new Date(startDate as string),
          new Date(endDate as string)
        )
      );
    }

    const tasks = await db.query.projectTasks.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        project: {
          columns: { id: true, projectName: true, projectNumber: true },
        },
        assignedUser: {
          columns: { id: true, userFirst: true, userLast: true },
        },
        linkedWalk: true,
      },
      orderBy: [desc(projectTasks.scheduledDate)],
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);

    // Fetch task then verify its project belongs to the org
    const task = await db.query.projectTasks.findFirst({
      where: eq(projectTasks.id, taskId),
      with: {
        project: true,
        assignedUser: true,
        creator: true,
        linkedWalk: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify the task's project belongs to this org
    if ((task.project as any)?.orgId !== req.user!.orgId!) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create new task
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      projectId,
      taskName,
      description,
      taskType,
      scheduledDate,
      dueDate,
      assignedTo,
      priority,
      linkedToWalkId,
      notes,
    } = req.body;

    if (!projectId || !taskName || !taskType || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newTask] = await db.insert(projectTasks).values({
      projectId,
      taskName,
      description: description || null,
      taskType,
      scheduledDate: new Date(scheduledDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      linkedToWalkId: linkedToWalkId || null,
      notes: notes || null,
      createdBy: req.user!.id,
    }).returning();

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;

    // Handle date strings
    if (updates.scheduledDate) {
      updates.scheduledDate = new Date(updates.scheduledDate);
    }
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const [updated] = await db.update(projectTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
        ...(updates.status === 'completed' ? { completedDate: new Date() } : {}),
      })
      .where(eq(projectTasks.id, taskId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task: updated,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    await db.delete(projectTasks).where(eq(projectTasks.id, taskId));

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export { router as tasksRouter };
