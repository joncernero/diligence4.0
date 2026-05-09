import { Router } from 'express';
import { db } from '../db';
import { approvalRequests } from '../schema/schedule';
import { requireAuth, requireRole, INTERNAL_ROLES, AuthRequest } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';
import { createNotification } from '../utils/notifications';
import { users, userProjectAccess } from '../schema/users';

const router = Router();

const OWNER_ROLES = ['owner', 'client_view', ...INTERNAL_ROLES];

// GET /api/approvals — list for a project
// PMs see all; owners see only their project's requests
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, status, type } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const requests = await db.query.approvalRequests.findMany({
      where: eq(approvalRequests.projectId, parseInt(projectId as string)),
      with: {
        requester: { columns: { id: true, userFirst: true, userLast: true, userEmail: true } },
        responder: { columns: { id: true, userFirst: true, userLast: true } },
        project: { columns: { id: true, projectName: true } },
      },
      orderBy: [desc(approvalRequests.createdAt)],
    });

    // Filter by status / type if provided
    let filtered = requests;
    if (status) filtered = filtered.filter((r: any) => r.status === status);
    if (type) filtered = filtered.filter((r: any) => r.type === type);

    res.json({ requests: filtered });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// GET /api/approvals/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const request = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, parseInt(req.params.id)),
      with: {
        requester: { columns: { id: true, userFirst: true, userLast: true } },
        responder: { columns: { id: true, userFirst: true, userLast: true } },
        project: true,
      },
    });

    if (!request) return res.status(404).json({ error: 'Approval request not found' });
    res.json({ request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approval request' });
  }
});

// POST /api/approvals — PM creates a new approval request
router.post('/', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const {
      projectId, type, title, description,
      priority, dueDate, attachments, metadata,
    } = req.body;

    if (!projectId || !type || !title) {
      return res.status(400).json({ error: 'projectId, type, and title are required' });
    }

    const [newRequest] = await db.insert(approvalRequests).values({
      projectId,
      type,
      title,
      description: description || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      attachments: attachments || null,
      metadata: metadata || null,
      requestedBy: req.user!.id,
      status: 'pending',
    }).returning();

    // Notify all owner-role users who have access to this project
    try {
      const ownerAccess = await db.query.userProjectAccess.findMany({
        where: eq(userProjectAccess.projectId, projectId),
        with: { user: { columns: { id: true, userRole: true } } },
      });

      const ownerUsers = ownerAccess
        .filter((a: any) => ['owner', 'client_view'].includes(a.user?.userRole))
        .map((a: any) => a.user);

      // Also find any users directly with owner role on the project (by org)
      for (const owner of ownerUsers) {
        await createNotification({
          userId: owner.id,
          type: 'approval_requested',
          title: `Action Required: ${title}`,
          message: `A new ${type.replace(/_/g, ' ')} requires your approval.`,
          relatedEntityType: 'approval_request',
          relatedEntityId: newRequest.id,
          actionUrl: `/owner/approvals/${newRequest.id}`,
          metadata: { requestType: type, projectId },
        });
      }
    } catch (notifError) {
      console.error('Failed to send owner notifications:', notifError);
    }

    res.status(201).json({ message: 'Approval request created', request: newRequest });
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ error: 'Failed to create approval request' });
  }
});

// PUT /api/approvals/:id/respond — Owner submits approval decision
router.put('/:id/respond', requireAuth, requireRole(OWNER_ROLES), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, responseNote } = req.body;

    const validStatuses = ['approved', 'rejected', 'info_requested'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const [updated] = await db
      .update(approvalRequests)
      .set({
        status,
        responseNote: responseNote || null,
        respondedBy: req.user!.id,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Request not found' });

    // Notify the PM who submitted the request
    try {
      const fullRequest = await db.query.approvalRequests.findFirst({
        where: eq(approvalRequests.id, id),
        with: { requester: true },
      });

      if (fullRequest?.requestedBy) {
        const statusLabel = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'returned for more info';
        await createNotification({
          userId: fullRequest.requestedBy,
          type: 'approval_responded',
          title: `Approval ${statusLabel}: ${fullRequest.title}`,
          message: responseNote || `The owner has ${statusLabel} your request.`,
          relatedEntityType: 'approval_request',
          relatedEntityId: id,
          actionUrl: `/dashboard/approvals/${id}`,
          metadata: { status, projectId: fullRequest.projectId },
        });
      }
    } catch {}

    res.json({ message: 'Response recorded', request: updated });
  } catch (error) {
    console.error('Respond to approval error:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// PUT /api/approvals/:id — PM edits/updates request (e.g., withdraw)
router.put('/:id', requireAuth, requireRole(INTERNAL_ROLES), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body };
    delete updates.id; delete updates.requestedBy; delete updates.createdAt;
    delete updates.respondedBy; delete updates.respondedAt;

    const [updated] = await db
      .update(approvalRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(approvalRequests.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Updated', request: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update approval request' });
  }
});

export { router as approvalsRouter };
