import { Router } from 'express';
import { db } from '../db';
import { propertyWalks, observations } from '../schema/walks';
import { requireAuth, requireRole, requireFeature, AuthRequest } from '../middleware/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { sendEmail, emailTemplates } from '../utils/email';
import { users } from '../schema/users';
import { projects } from '../schema/projects';

const router = Router();

// GET /api/walks - Get all walks for the requesting org (optionally filtered by project)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, propertyId, status } = req.query;

    const whereClause = projectId
      ? and(
          eq(propertyWalks.orgId, req.user!.orgId!),
          eq(propertyWalks.projectId, parseInt(projectId as string)),
        )
      : eq(propertyWalks.orgId, req.user!.orgId!);

    const walks = await db.query.propertyWalks.findMany({
      where: whereClause,
      with: {
        conductor: {
          columns: {
            id: true,
            userFirst: true,
            userLast: true,
            userEmail: true,
          },
        },
        project: {
          columns: { id: true, projectName: true, projectNumber: true },
        },
        property: {
          columns: { id: true, propName: true, propAddress: true },
        },
        observations: true,
      },
      orderBy: [desc(propertyWalks.walkDate)],
    });

    res.json({ walks });
  } catch (error) {
    console.error('Get walks error:', error);
    res.status(500).json({ error: 'Failed to fetch walks' });
  }
});

// GET /api/walks/:id - Get walk by ID with observations (org-scoped)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const walkId = parseInt(req.params.id);

    const walk = await db.query.propertyWalks.findFirst({
      where: and(
        eq(propertyWalks.id, walkId),
        eq(propertyWalks.orgId, req.user!.orgId!),
      ),
      with: {
        conductor: true,
        project: true,
        property: true,
        observations: {
          with: {
            assignee: {
              columns: { id: true, userFirst: true, userLast: true },
            },
            photos: true,
            comments: {
              with: {
                user: {
                  columns: { id: true, userFirst: true, userLast: true },
                },
              },
            },
          },
        },
      },
    });

    if (!walk) {
      return res.status(404).json({ error: 'Walk not found' });
    }

    res.json({ walk });
  } catch (error) {
    console.error('Get walk error:', error);
    res.status(500).json({ error: 'Failed to fetch walk' });
  }
});

// POST /api/walks - Create new walk
router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'pm', 'super', 'pe']),
  async (req: AuthRequest, res) => {
    try {
      const {
        projectId,
        propertyId,
        walkDate,
        walkType,
        conductedBy,
        attendees,
        notes,
        weatherConditions,
      } = req.body;

      if (!projectId || !propertyId || !walkDate || !walkType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [newWalk] = await db
        .insert(propertyWalks)
        .values({
          orgId: req.user!.orgId!,
          projectId,
          propertyId,
          walkDate: new Date(walkDate),
          walkType,
          walkStatus: 'scheduled',
          conductedBy: conductedBy || req.user!.id,
          attendees: attendees || null,
          notes: notes || null,
          weatherConditions: weatherConditions || null,
          createdBy: req.user!.id,
        })
        .returning();

      // Fire walkScheduled emails to all attendees and conductor (non-blocking)
      (async () => {
        try {
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            columns: { projectName: true },
          });
          const projectName = project?.projectName || 'your project';
          const formattedDate = new Date(walkDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          });
          const formattedType = String(walkType).replace(/_/g, ' ');
          const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}/walks/${newWalk.id}`;

          // Collect user IDs to notify: conductor + numeric attendee IDs
          const userIds = new Set<number>();
          if (conductedBy) userIds.add(conductedBy);
          if (Array.isArray(attendees)) {
            attendees.forEach((a: any) => { if (typeof a === 'number') userIds.add(a); });
          }
          userIds.delete(req.user!.id); // Don't email the person who scheduled it

          if (userIds.size > 0) {
            const attendeeUsers = await db.query.users.findMany({
              where: inArray(users.id, [...userIds]),
              columns: { userEmail: true, userFirst: true, userLast: true },
            });
            await Promise.all(
              attendeeUsers.map(u =>
                sendEmail({
                  to: u.userEmail,
                  subject: `Walk Scheduled: ${formattedType} on ${formattedDate}`,
                  html: emailTemplates.walkScheduled({
                    userName: `${u.userFirst} ${u.userLast}`,
                    walkType: formattedType,
                    walkDate: formattedDate,
                    projectName,
                    actionUrl,
                  }),
                }).catch(err => console.error('Email send failed (walkScheduled):', err))
              )
            );
          }
        } catch (err) {
          console.error('walkScheduled email block failed:', err);
        }
      })();

      res.status(201).json({
        message: 'Walk created successfully',
        walk: newWalk,
      });
    } catch (error) {
      console.error('Create walk error:', error);
      res.status(500).json({ error: 'Failed to create walk' });
    }
  },
);

// PUT /api/walks/:id - Update walk
router.put(
  '/:id',
  requireAuth,
  requireRole(['admin', 'pm', 'super', 'pe']),
  async (req, res) => {
    try {
      const walkId = parseInt(req.params.id);
      const updates = req.body;

      delete updates.id;
      delete updates.createdBy;
      delete updates.createdAt;

      const [updatedWalk] = await db
        .update(propertyWalks)
        .set({
          ...updates,
          updatedAt: new Date(),
          ...(updates.walkStatus === 'completed'
            ? { completedAt: new Date() }
            : {}),
        })
        .where(and(eq(propertyWalks.id, walkId), eq(propertyWalks.orgId, (req as AuthRequest).user!.orgId!)))
        .returning();

      if (!updatedWalk) {
        return res.status(404).json({ error: 'Walk not found' });
      }

      // Fire walkCompleted email to project PM when walk is marked complete
      if (updates.walkStatus === 'completed') {
        (async () => {
          try {
            const fullWalk = await db.query.propertyWalks.findFirst({
              where: eq(propertyWalks.id, walkId),
              with: {
                project: { columns: { id: true, projectName: true, projectManagerId: true } },
                observations: { columns: { id: true } },
              },
            });
            if (!fullWalk || !(fullWalk.project as any)?.projectManagerId) return;

            const pm = await db.query.users.findFirst({
              where: eq(users.id, (fullWalk.project as any).projectManagerId),
              columns: { userEmail: true, userFirst: true, userLast: true },
            });
            if (!pm) return;

            const formattedDate = new Date(fullWalk.walkDate).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });
            const obsCount = (fullWalk.observations || []).length;
            const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/projects/${(fullWalk.project as any).id}/walks/${walkId}`;

            sendEmail({
              to: pm.userEmail,
              subject: `Walk Completed: ${fullWalk.walkType.replace(/_/g, ' ')} — ${(fullWalk.project as any).projectName}`,
              html: emailTemplates.walkCompleted({
                userName: `${pm.userFirst} ${pm.userLast}`,
                walkType: fullWalk.walkType.replace(/_/g, ' '),
                walkDate: formattedDate,
                projectName: (fullWalk.project as any).projectName,
                observationCount: obsCount,
                actionUrl,
              }),
            }).catch(err => console.error('Email send failed (walkCompleted):', err));
          } catch (err) {
            console.error('walkCompleted email block failed:', err);
          }
        })();
      }

      res.json({
        message: 'Walk updated successfully',
        walk: updatedWalk,
      });
    } catch (error) {
      console.error('Update walk error:', error);
      res.status(500).json({ error: 'Failed to update walk' });
    }
  },
);

// GET /api/walks/:id/export?format=csv|excel|pdf  — Download observations report
// CSV is available to all tiers; excel/pdf require the 'advanced_exports' feature
router.get('/:id/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const walkId = parseInt(req.params.id);
    const format = (req.query.format as string || 'csv').toLowerCase();

    const walk = await db.query.propertyWalks.findFirst({
      where: and(
        eq(propertyWalks.id, walkId),
        eq(propertyWalks.orgId, req.user!.orgId!),
      ),
      with: {
        conductor: { columns: { id: true, userFirst: true, userLast: true } },
        project: { columns: { id: true, projectName: true, projectNumber: true } },
        property: { columns: { id: true, propName: true, propAddress: true } },
        observations: {
          with: {
            assignee: { columns: { id: true, userFirst: true, userLast: true } },
            creator: { columns: { id: true, userFirst: true, userLast: true } },
            photos: true,
          },
        },
      },
    });

    if (!walk) return res.status(404).json({ error: 'Walk not found' });

    const walkDate = new Date(walk.walkDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const conductorName = walk.conductor
      ? `${walk.conductor.userFirst} ${walk.conductor.userLast}`
      : 'N/A';
    const safeWalkType = walk.walkType.replace(/_/g, ' ');
    const obs = walk.observations || [];

    // ── CSV ───────────────────────────────────────────────────────────────────
    if (format === 'csv') {
      const headers = [
        'ID', 'Title', 'Description', 'Category', 'Severity', 'Status',
        'Priority', 'Location', 'Assigned To', 'Trade', 'Due Date',
        'Created By', 'Created At', 'Photo URLs',
      ];

      const escape = (v: any) => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const rows = obs.map((o: any) => [
        o.id,
        o.title,
        o.description,
        o.category || '',
        o.severity || '',
        o.status || '',
        o.priority || '',
        o.location || '',
        o.assignee ? `${o.assignee.userFirst} ${o.assignee.userLast}` : '',
        o.tradeType || '',
        o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '',
        o.creator ? `${o.creator.userFirst} ${o.creator.userLast}` : '',
        new Date(o.createdAt).toLocaleDateString(),
        (o.photos || []).map((p: any) => p.photoUrl).join(' | '),
      ].map(escape).join(','));

      const meta = [
        `# Walk Report — ${safeWalkType}`,
        `# Date: ${walkDate}`,
        `# Conducted By: ${conductorName}`,
        `# Property: ${walk.property?.propName || 'N/A'}`,
        `# Status: ${walk.walkStatus}`,
        `# Total Observations: ${obs.length}`,
        '',
      ].join('\n');

      const csv = meta + [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="walk-${walkId}-observations.csv"`,
      );
      return res.send(csv);
    }

    // ── EXCEL ─────────────────────────────────────────────────────────────────
    if (format === 'excel') {
      const XLSX = await import('xlsx');

      // Sheet 1: Walk Info
      const infoData = [
        ['Walk Report'],
        [],
        ['Walk Type', safeWalkType],
        ['Date', walkDate],
        ['Status', walk.walkStatus],
        ['Conducted By', conductorName],
        ['Property', walk.property?.propName || 'N/A'],
        ['Address', walk.property?.propAddress || 'N/A'],
        ['Project', walk.project?.projectName || 'N/A'],
        ['Total Observations', obs.length],
        walk.notes ? ['Notes', walk.notes] : [],
      ].filter(r => r.length > 0);

      const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
      infoSheet['A1'] && (infoSheet['A1'].s = { font: { bold: true, sz: 14 } });

      // Sheet 2: Observations
      const obsHeaders = [
        'ID', 'Title', 'Description', 'Category', 'Severity', 'Status',
        'Priority', 'Location', 'Assigned To', 'Trade', 'Due Date',
        'Created By', 'Created At', 'Photo URLs',
      ];

      const obsRows = obs.map((o: any) => [
        o.id,
        o.title,
        o.description || '',
        o.category || '',
        o.severity || '',
        o.status || '',
        o.priority || '',
        o.location || '',
        o.assignee ? `${o.assignee.userFirst} ${o.assignee.userLast}` : '',
        o.tradeType || '',
        o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '',
        o.creator ? `${o.creator.userFirst} ${o.creator.userLast}` : '',
        new Date(o.createdAt).toLocaleDateString(),
        (o.photos || []).map((p: any) => p.photoUrl).join('\n'),
      ]);

      const obsSheet = XLSX.utils.aoa_to_sheet([obsHeaders, ...obsRows]);

      // Auto column widths (rough heuristic)
      obsSheet['!cols'] = obsHeaders.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...obsRows.map(r => String(r[i] || '').length).slice(0, 50),
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, infoSheet, 'Walk Info');
      XLSX.utils.book_append_sheet(wb, obsSheet, 'Observations');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="walk-${walkId}-observations.xlsx"`,
      );
      return res.send(buffer);
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    if (format === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="walk-${walkId}-observations.pdf"`,
      );
      doc.pipe(res);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Walk Observations Report', { align: 'center' });
      doc.moveDown(0.5);

      // Walk metadata table
      doc.fontSize(11).font('Helvetica');
      const meta: [string, string][] = [
        ['Walk Type', safeWalkType],
        ['Date', walkDate],
        ['Status', walk.walkStatus],
        ['Conducted By', conductorName],
        ['Property', walk.property?.propName || 'N/A'],
        ['Project', walk.project?.projectName || 'N/A'],
        ['Total Observations', String(obs.length)],
      ];

      meta.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
           .font('Helvetica').text(value);
      });

      if (walk.notes) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Notes: ', { continued: true })
           .font('Helvetica').text(walk.notes);
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.5);

      // Observations
      if (obs.length === 0) {
        doc.fontSize(12).text('No observations recorded for this walk.', { align: 'center' });
      } else {
        obs.forEach((o: any, idx: number) => {
          // Page break check
          if (doc.y > doc.page.height - 150) doc.addPage();

          doc.fontSize(13).font('Helvetica-Bold')
             .text(`${idx + 1}. ${o.title}`);

          doc.fontSize(10).font('Helvetica').fillColor('#555555')
             .text(o.description || '', { indent: 12 });

          doc.moveDown(0.3);
          const chips: string[] = [];
          if (o.severity)  chips.push(`Severity: ${o.severity}`);
          if (o.category)  chips.push(`Category: ${o.category.replace(/_/g, ' ')}`);
          if (o.status)    chips.push(`Status: ${o.status.replace(/_/g, ' ')}`);
          if (o.priority)  chips.push(`Priority: ${o.priority}`);
          if (o.tradeType) chips.push(`Trade: ${o.tradeType}`);

          doc.fillColor('#000000').fontSize(10).text(chips.join('   ·   '), { indent: 12 });

          if (o.location) {
            doc.text(`📍 ${o.location}`, { indent: 12 });
          }
          if (o.assignee) {
            doc.text(`Assigned to: ${o.assignee.userFirst} ${o.assignee.userLast}`, { indent: 12 });
          }
          if (o.dueDate) {
            doc.text(`Due: ${new Date(o.dueDate).toLocaleDateString()}`, { indent: 12 });
          }

          // Photo URLs
          const photos: any[] = o.photos || [];
          if (photos.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').fontSize(9).text(`Photos (${photos.length}):`, { indent: 12 });
            photos.forEach((p: any, pi: number) => {
              doc.font('Helvetica').fontSize(9)
                 .text(`  ${pi + 1}. ${p.caption || p.fileName || 'Photo'}: ${p.photoUrl}`, {
                   indent: 16,
                   link: p.photoUrl,
                   underline: true,
                 });
            });
          }

          doc.moveDown(0.8);
          // Subtle divider between observations
          if (idx < obs.length - 1) {
            doc.moveTo(50, doc.y)
               .lineTo(doc.page.width - 50, doc.y)
               .dash(3, { space: 3 })
               .stroke('#cccccc')
               .undash();
            doc.moveDown(0.5);
          }
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#999999')
         .text(
           `Generated ${new Date().toLocaleString()} · Diligence Walk Report`,
           50, doc.page.height - 40,
           { align: 'center' },
         );

      doc.end();
      return;
    }

    return res.status(400).json({ error: 'Invalid format. Use csv, excel, or pdf.' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// DELETE /api/walks/:id - Delete walk
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin', 'pm']),
  async (req, res) => {
    try {
      const walkId = parseInt(req.params.id);

      await db.delete(propertyWalks).where(
        and(eq(propertyWalks.id, walkId), eq(propertyWalks.orgId, (req as AuthRequest).user!.orgId!))
      );

      res.json({ message: 'Walk deleted successfully' });
    } catch (error) {
      console.error('Delete walk error:', error);
      res.status(500).json({ error: 'Failed to delete walk' });
    }
  },
);

export { router as walksRouter };
