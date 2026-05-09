import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { projectDocuments, documentCategories, documentVersions } from '../schema/documents';
import { requireAuth, requireRole, requireFeature, AuthRequest } from '../middleware/auth';
import { eq, and, desc, or, like } from 'drizzle-orm';
import { uploadToR2, generateFileKey, deleteFromR2 } from '../utils/r2Upload';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// GET /api/documents/categories - Get all document categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await db.query.documentCategories.findMany({
      where: eq(documentCategories.isActive, true),
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/documents/categories/seed - Seed document categories
router.post('/categories/seed', requireAuth, requireRole(['admin', 'super', 'pm']), async (req, res) => {
  try {
    const { documentCategoriesData } = await import('../data/documentCategories');
    
    const existing = await db.query.documentCategories.findMany();
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Categories already seeded', count: existing.length });
    }

    const inserted = await db.insert(documentCategories).values(documentCategoriesData).returning();

    res.status(201).json({ message: 'Categories seeded successfully', count: inserted.length });
  } catch (error) {
    console.error('Seed categories error:', error);
    res.status(500).json({ error: 'Failed to seed categories' });
  }
});

// GET /api/documents?projectId=1 - Get documents for a project (org-scoped)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, categoryId, search } = req.query;

    // Always scope to the requesting org
    let whereConditions: any[] = [
      eq(projectDocuments.orgId, req.user!.orgId!),
    ];

    if (projectId) {
      whereConditions.push(eq(projectDocuments.projectId, parseInt(projectId as string)));
    }

    if (categoryId) {
      whereConditions.push(eq(projectDocuments.categoryId, parseInt(categoryId as string)));
    }

    // Only show latest versions by default
    whereConditions.push(eq(projectDocuments.isLatestVersion, true));

    const documents = await db.query.projectDocuments.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        category: true,
        project: {
          columns: { id: true, projectName: true },
        },
        uploader: {
          columns: { id: true, userFirst: true, userLast: true },
        },
        versions: true,
      },
      orderBy: [desc(projectDocuments.uploadedAt)],
    });

    // Filter by search if provided
    let filteredDocs = documents;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredDocs = documents.filter(doc =>
        doc.documentName.toLowerCase().includes(searchLower) ||
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower)
      );
    }

    res.json({ documents: filteredDocs });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id - Get single document (org-scoped)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.id);

    const document = await db.query.projectDocuments.findFirst({
      where: and(
        eq(projectDocuments.id, docId),
        eq(projectDocuments.orgId, req.user!.orgId!),
      ),
      with: {
        category: true,
        project: true,
        scopeItem: true,
        uploader: true,
        versions: {
          with: {
            uploader: {
              columns: { id: true, userFirst: true, userLast: true },
            },
          },
          orderBy: [desc(documentVersions.versionNumber)],
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/documents - Upload new document
router.post('/', requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    const { projectId, categoryId, documentName, description, linkedToScopeId, tags } = req.body;

    if (!file || !projectId || !documentName) {
      return res.status(400).json({ error: 'File, project ID, and document name are required' });
    }

    // Upload to R2
    const fileKey = generateFileKey(file.originalname, 'documents');
    const { url, key } = await uploadToR2(file.buffer, fileKey, file.mimetype);

    // Create document record
    const [newDocument] = await db.insert(projectDocuments).values({
      orgId: req.user!.orgId!,
      projectId: parseInt(projectId),
      categoryId: categoryId ? parseInt(categoryId) : null,
      documentName,
      description: description || null,
      fileUrl: url,
      fileKey: key,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      version: 1,
      isLatestVersion: true,
      linkedToScopeId: linkedToScopeId ? parseInt(linkedToScopeId) : null,
      tags: tags ? JSON.parse(tags) : null,
      uploadedBy: req.user!.id,
    }).returning();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// POST /api/documents/:id/new-version - Upload new version
router.post('/:id/new-version', requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.id);
    const file = req.file;
    const { changeNote } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Get current document (org-scoped)
    const currentDoc = await db.query.projectDocuments.findFirst({
      where: and(
        eq(projectDocuments.id, docId),
        eq(projectDocuments.orgId, req.user!.orgId!),
      ),
    });

    if (!currentDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Archive current version
    await db.insert(documentVersions).values({
      documentId: docId,
      versionNumber: currentDoc.version,
      fileUrl: currentDoc.fileUrl,
      fileKey: currentDoc.fileKey,
      fileName: currentDoc.fileName,
      fileSize: currentDoc.fileSize,
      uploadedBy: currentDoc.uploadedBy!,
      uploadedAt: currentDoc.uploadedAt,
    });

    // Upload new file
    const fileKey = generateFileKey(file.originalname, 'documents');
    const { url, key } = await uploadToR2(file.buffer, fileKey, file.mimetype);

    // Update document with new version
    const [updatedDoc] = await db.update(projectDocuments)
      .set({
        fileUrl: url,
        fileKey: key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        version: currentDoc.version + 1,
        uploadedBy: req.user!.id,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projectDocuments.id, docId))
      .returning();

    res.json({
      message: 'New version uploaded successfully',
      document: updatedDoc,
    });
  } catch (error) {
    console.error('Upload version error:', error);
    res.status(500).json({ error: 'Failed to upload new version' });
  }
});

// PUT /api/documents/:id - Update document metadata (org-scoped)
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.id);
    const updates = req.body;

    delete updates.id;
    delete updates.orgId;        // Never allow changing org
    delete updates.uploadedBy;
    delete updates.uploadedAt;
    delete updates.fileUrl;
    delete updates.fileKey;

    const [updated] = await db.update(projectDocuments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(projectDocuments.id, docId), eq(projectDocuments.orgId, req.user!.orgId!)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      message: 'Document updated successfully',
      document: updated,
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - Delete document (org-scoped)
router.delete('/:id', requireAuth, requireRole(['admin', 'pm', 'super']), async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.id);

    const document = await db.query.projectDocuments.findFirst({
      where: and(
        eq(projectDocuments.id, docId),
        eq(projectDocuments.orgId, req.user!.orgId!),
      ),
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from R2
    await deleteFromR2(document.fileKey);

    // Delete from database
    await db.delete(projectDocuments).where(eq(projectDocuments.id, docId));

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export { router as documentsRouter };
