import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import {
  observations,
  observationPhotos,
  observationComments,
} from '../schema/walks';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { uploadToR2, generateFileKey } from '../utils/r2Upload';
import { createNotification } from '../utils/notifications';
import { sendEmail, emailTemplates } from '../utils/email';
import { users } from '../schema/users';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// GET /api/observations - Get observations scoped to the requesting org
// Requires either walkId or projectId to prevent unbounded cross-org queries
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { walkId, projectId, status } = req.query;

    // Build where clause — always enforce org isolation via projectId linkage
    let whereClause;
    if (!walkId && !projectId) {
      // No scope given (e.g. dashboard summary view) — fall back to every
      // observation across the requesting user's org, never cross-org.
      const { projects } = await import('../schema/projects');
      const orgProjects = await db.query.projects.findMany({
        where: eq(projects.orgId, req.user!.orgId!),
        columns: { id: true },
      });
      const projectIds = orgProjects.map((p) => p.id);
      if (projectIds.length === 0) {
        return res.json({ observations: [] });
      }
      whereClause = inArray(observations.projectId, projectIds);
    } else if (walkId) {
      // Verify the walk belongs to this org before returning its observations
      const { propertyWalks } = await import('../schema/walks');
      const walk = await db.query.propertyWalks.findFirst({
        where: and(
          eq(propertyWalks.id, parseInt(walkId as string)),
          eq(propertyWalks.orgId, req.user!.orgId!),
        ),
        columns: { id: true },
      });
      if (!walk) {
        return res.status(404).json({ error: 'Walk not found' });
      }
      whereClause = eq(observations.walkId, parseInt(walkId as string));
    } else {
      // Verify the project belongs to this org
      const { projects } = await import('../schema/projects');
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
      whereClause = eq(observations.projectId, parseInt(projectId as string));
    }

    const allObservations = await db.query.observations.findMany({
      where: whereClause,
      with: {
        assignee: {
          columns: {
            id: true,
            userFirst: true,
            userLast: true,
            userEmail: true,
          },
        },
        creator: {
          columns: { id: true, userFirst: true, userLast: true },
        },
        photos: true,
        comments: {
          with: {
            user: {
              columns: { id: true, userFirst: true, userLast: true },
            },
          },
          orderBy: [desc(observationComments.createdAt)],
        },
      },
      orderBy: [desc(observations.createdAt)],
    });

    res.json({ observations: allObservations });
  } catch (error) {
    console.error('Get observations error:', error);
    res.status(500).json({ error: 'Failed to fetch observations' });
  }
});

// GET /api/observations/:id - Get observation by ID (org-scoped via project)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const observationId = parseInt(req.params.id);

    const observation = await db.query.observations.findFirst({
      where: eq(observations.id, observationId),
      with: {
        walk: true,
        project: true,
        assignee: true,
        creator: true,
        photos: {
          with: {
            uploader: {
              columns: { id: true, userFirst: true, userLast: true },
            },
          },
        },
        comments: {
          with: {
            user: {
              columns: { id: true, userFirst: true, userLast: true },
            },
          },
          orderBy: [desc(observationComments.createdAt)],
        },
      },
    });

    if (!observation) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    // Verify the observation's project belongs to this org
    if ((observation.project as any)?.orgId !== req.user!.orgId!) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    res.json({ observation });
  } catch (error) {
    console.error('Get observation error:', error);
    res.status(500).json({ error: 'Failed to fetch observation' });
  }
});

// GET /api/observations/assigned - Contractor view: only observations assigned to the current user
router.get('/assigned', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const whereClause = status
      ? and(
          eq(observations.assignedTo, req.user!.id),
          eq(observations.status, status as string),
        )
      : eq(observations.assignedTo, req.user!.id);

    const assigned = await db.query.observations.findMany({
      where: whereClause,
      with: {
        project: { columns: { id: true, projectName: true, projectNumber: true } },
        walk: { columns: { id: true, walkDate: true, walkType: true, walkStatus: true } },
        creator: { columns: { id: true, userFirst: true, userLast: true } },
        photos: true,
        comments: {
          with: {
            user: { columns: { id: true, userFirst: true, userLast: true } },
          },
          orderBy: [desc(observationComments.createdAt)],
        },
      },
      orderBy: [desc(observations.createdAt)],
    });

    res.json({ observations: assigned });
  } catch (error) {
    console.error('Get assigned observations error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned observations' });
  }
});

// POST /api/observations - Create new observation
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      walkId,
      projectId,
      buildingId,
      unitId,
      location,
      title,
      description,
      category,
      severity,
      assignedTo,
      assignedToOrgId,
      tradeType,
      priority,
      dueDate,
    } = req.body;

    if (!walkId || !projectId || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newObservation] = await db
      .insert(observations)
      .values({
        walkId,
        projectId,
        buildingId: buildingId || null,
        unitId: unitId || null,
        location: location || null,
        title,
        description,
        category: category || null,
        severity: severity || null,
        assignedTo: assignedTo || null,
        assignedToOrgId: assignedToOrgId || null,
        tradeType: tradeType || null,
        status: 'open',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        createdBy: req.user!.id,
      })
      .returning();

    // Send notification + email if assigned during creation
    if (newObservation.assignedTo) {
      const fullObs = await db.query.observations.findFirst({
        where: eq(observations.id, newObservation.id),
        with: { project: true },
      });

      if (fullObs) {
        const actionUrl = `/dashboard/projects/${fullObs.projectId}/walks/${fullObs.walkId}`;
        await createNotification({
          userId: newObservation.assignedTo,
          type: 'observation_assigned',
          title: 'New Observation Assigned',
          message: `You have been assigned: ${newObservation.title}`,
          relatedEntityType: 'observation',
          relatedEntityId: newObservation.id,
          actionUrl,
          metadata: {
            observationTitle: newObservation.title,
            projectName: fullObs.project?.projectName,
          },
        });

        // Send email to assigned user
        const assignee = await db.query.users.findFirst({
          where: eq(users.id, newObservation.assignedTo),
          columns: { userEmail: true, userFirst: true, userLast: true },
        });
        if (assignee) {
          sendEmail({
            to: assignee.userEmail,
            subject: `New Observation Assigned: ${newObservation.title}`,
            html: emailTemplates.observationAssigned({
              userName: `${assignee.userFirst} ${assignee.userLast}`,
              observationTitle: newObservation.title,
              projectName: (fullObs.project as any)?.projectName || 'your project',
              actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${actionUrl}`,
            }),
          }).catch(err => console.error('Email send failed (observationAssigned):', err));
        }
      }
    }

    res.status(201).json({
      message: 'Observation created successfully',
      observation: newObservation,
    });
  } catch (error) {
    console.error('Create observation error:', error);
    res.status(500).json({ error: 'Failed to create observation' });
  }
});

// PUT /api/observations/:id - Update observation
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const observationId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;

    // Fetch current observation BEFORE update so we can detect what changed
    const currentObs = await db.query.observations.findFirst({
      where: eq(observations.id, observationId),
      with: {
        project: { columns: { id: true, projectName: true, projectManagerId: true } },
      },
    });

    if (!currentObs) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    const assigneeChanged =
      updates.assignedTo !== undefined &&
      updates.assignedTo !== currentObs.assignedTo;
    const statusChanged =
      updates.status !== undefined &&
      updates.status !== currentObs.status;

    const [updatedObservation] = await db
      .update(observations)
      .set({
        ...updates,
        updatedAt: new Date(),
        ...(updates.status === 'resolved' ? { resolvedAt: new Date() } : {}),
        ...(updates.status === 'verified' ? { verifiedAt: new Date() } : {}),
      })
      .where(eq(observations.id, observationId))
      .returning();

    if (!updatedObservation) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    const project = currentObs.project as any;
    const actionUrl = `/dashboard/projects/${currentObs.projectId}/walks/${currentObs.walkId}`;
    const fullActionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${actionUrl}`;

    // ── Assignee changed: notification + email to new assignee ────────────────
    if (assigneeChanged && updatedObservation.assignedTo) {
      await createNotification({
        userId: updatedObservation.assignedTo,
        type: 'observation_assigned',
        title: 'New Observation Assigned',
        message: `You have been assigned: ${updatedObservation.title}`,
        relatedEntityType: 'observation',
        relatedEntityId: observationId,
        actionUrl,
        metadata: {
          observationTitle: updatedObservation.title,
          projectName: project?.projectName,
        },
      });

      const assignee = await db.query.users.findFirst({
        where: eq(users.id, updatedObservation.assignedTo),
        columns: { userEmail: true, userFirst: true, userLast: true },
      });
      if (assignee) {
        sendEmail({
          to: assignee.userEmail,
          subject: `Observation Assigned to You: ${updatedObservation.title}`,
          html: emailTemplates.observationAssigned({
            userName: `${assignee.userFirst} ${assignee.userLast}`,
            observationTitle: updatedObservation.title,
            projectName: project?.projectName || 'your project',
            actionUrl: fullActionUrl,
          }),
        }).catch(err => console.error('Email send failed (observationAssigned):', err));
      }
    }

    // ── Status changed: comment + email to creator and PM ─────────────────────
    if (statusChanged) {
      await db.insert(observationComments).values({
        observationId,
        comment: `Status changed to ${updates.status}`,
        commentType: 'status_change',
        userId: req.user!.id,
      });

      // Email the observation creator
      if (currentObs.createdBy && currentObs.createdBy !== req.user!.id) {
        const creator = await db.query.users.findFirst({
          where: eq(users.id, currentObs.createdBy),
          columns: { userEmail: true, userFirst: true, userLast: true },
        });
        if (creator) {
          sendEmail({
            to: creator.userEmail,
            subject: `Observation Status Updated: ${updatedObservation.title}`,
            html: emailTemplates.observationStatusChange({
              userName: `${creator.userFirst} ${creator.userLast}`,
              observationTitle: updatedObservation.title,
              oldStatus: currentObs.status,
              newStatus: updates.status,
              projectName: project?.projectName || 'your project',
              actionUrl: fullActionUrl,
            }),
          }).catch(err => console.error('Email send failed (observationStatusChange creator):', err));
        }
      }

      // Also email the project PM (if different from creator and current user)
      if (project?.projectManagerId &&
          project.projectManagerId !== req.user!.id &&
          project.projectManagerId !== currentObs.createdBy) {
        const pm = await db.query.users.findFirst({
          where: eq(users.id, project.projectManagerId),
          columns: { userEmail: true, userFirst: true, userLast: true },
        });
        if (pm) {
          sendEmail({
            to: pm.userEmail,
            subject: `Observation Status Updated: ${updatedObservation.title}`,
            html: emailTemplates.observationStatusChange({
              userName: `${pm.userFirst} ${pm.userLast}`,
              observationTitle: updatedObservation.title,
              oldStatus: currentObs.status,
              newStatus: updates.status,
              projectName: project?.projectName || 'your project',
              actionUrl: fullActionUrl,
            }),
          }).catch(err => console.error('Email send failed (observationStatusChange pm):', err));
        }
      }
    }

    res.json({
      message: 'Observation updated successfully',
      observation: updatedObservation,
    });
  } catch (error) {
    console.error('Update observation error:', error);
    res.status(500).json({ error: 'Failed to update observation' });
  }
});

// POST /api/observations/:id/comments - Add comment to observation
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const observationId = parseInt(req.params.id);
    const { comment, commentType } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const [newComment] = await db
      .insert(observationComments)
      .values({
        observationId,
        comment,
        commentType: commentType || 'comment',
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST /api/observations/:id/photos - Upload photo to R2
router.post(
  '/:id/photos',
  requireAuth,
  upload.single('photo'),
  async (req: AuthRequest, res) => {
    try {
      const observationId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No photo file provided' });
      }

      // Generate unique key and upload to R2
      const fileKey = generateFileKey(file.originalname);
      const { url, key } = await uploadToR2(
        file.buffer,
        fileKey,
        file.mimetype,
      );

      // Save photo record to database
      const [newPhoto] = await db
        .insert(observationPhotos)
        .values({
          observationId,
          photoUrl: url,
          photoKey: key,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          caption: req.body.caption || null,
          photoType: req.body.photoType || 'before',
          uploadedBy: req.user!.id,
        })
        .returning();

      res.status(201).json({
        message: 'Photo uploaded successfully',
        photo: newPhoto,
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  },
);

export { router as observationsRouter };
