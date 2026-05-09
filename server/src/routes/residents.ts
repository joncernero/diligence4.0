import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { users } from '../schema/users';
import { residentInvites, residentUnits } from '../schema/residents';
import { requireAuth, requireRole, INTERNAL_ROLES, AuthRequest } from '../middleware/auth';
import { eq, and, gt } from 'drizzle-orm';

const router = Router();

// ─── POST /api/residents/invite ──────────────────────────────────────────────
// PM sends an invite email to a resident
router.post('/invite', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const { email, propertyId, projectId, buildingId, unitNumber, firstName, lastName } = req.body;

    if (!email || !propertyId || !projectId) {
      return res.status(400).json({ error: 'email, propertyId, and projectId are required' });
    }

    // Check if a resident account already exists for this email
    const existing = await db.query.users.findFirst({
      where: eq(users.userEmail, email.toLowerCase()),
    });

    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Generate a secure token (expires in 7 days)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invite] = await db.insert(residentInvites).values({
      email: email.toLowerCase(),
      propertyId,
      projectId,
      buildingId: buildingId || null,
      unitNumber: unitNumber || null,
      token,
      expiresAt,
      invitedBy: req.user!.id,
    }).returning();

    // Send invite email via Resend
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: email,
        subject: 'You\'ve been invited to Diligence',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Welcome to Diligence</h2>
            <p>Your property manager has invited you to stay updated on work happening at your property.</p>
            ${unitNumber ? `<p><strong>Unit:</strong> ${unitNumber}</p>` : ''}
            <p>Click the button below to set up your account. This link expires in 7 days.</p>
            <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
              Set Up My Account
            </a>
            <p style="color:#6b7280;font-size:14px;">If you didn't expect this email, you can ignore it.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't block — return the invite token so PM can share manually
    }

    res.status(201).json({
      message: 'Invite sent',
      inviteId: invite.id,
      inviteUrl, // returned so PM can copy/share manually if email fails
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// ─── GET /api/residents/invite/:token ────────────────────────────────────────
// Validate a token (called when resident clicks the link)
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await db.query.residentInvites.findFirst({
      where: eq(residentInvites.token, token),
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.acceptedAt) {
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    res.json({
      valid: true,
      email: invite.email,
      unitNumber: invite.unitNumber,
      propertyId: invite.propertyId,
      projectId: invite.projectId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate invite' });
  }
});

// ─── POST /api/residents/accept-invite ───────────────────────────────────────
// Resident sets their password and activates their account
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    if (!token || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const invite = await db.query.residentInvites.findFirst({
      where: eq(residentInvites.token, token),
    });

    if (!invite || invite.acceptedAt || new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create the resident user account
    const [newUser] = await db.insert(users).values({
      userEmail: invite.email,
      userPasswordHash: passwordHash,
      userFirst: firstName,
      userLast: lastName,
      userRole: 'resident',
    }).returning();

    // Link resident to their unit/property
    await db.insert(residentUnits).values({
      userId: newUser.id,
      propertyId: invite.propertyId,
      projectId: invite.projectId,
      buildingId: invite.buildingId || null,
      unitNumber: invite.unitNumber || null,
    });

    // Mark invite as accepted
    await db.update(residentInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(residentInvites.id, invite.id));

    // Issue JWT
    const jwtToken = jwt.sign(
      { id: newUser.id, email: newUser.userEmail, role: 'resident' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token: jwtToken,
      user: {
        id: newUser.id,
        email: newUser.userEmail,
        firstName: newUser.userFirst,
        lastName: newUser.userLast,
        role: 'resident',
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ─── GET /api/residents/me ────────────────────────────────────────────────────
// Returns the current resident's unit/property info
router.get('/me', requireAuth, requireRole(['resident']), async (req: AuthRequest, res) => {
  try {
    const unit = await db.query.residentUnits.findFirst({
      where: and(
        eq(residentUnits.userId, req.user!.id),
        eq(residentUnits.isActive, true)
      ),
    });

    res.json({ unit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resident info' });
  }
});

// ─── GET /api/residents (PM only) ────────────────────────────────────────────
// List all residents for a property
router.get('/', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const { propertyId } = req.query;

    const units = await db.query.residentUnits.findMany({
      where: propertyId
        ? eq(residentUnits.propertyId, parseInt(propertyId as string))
        : undefined,
      with: { user: true },
    });

    res.json({ residents: units });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// ─── POST /api/residents/bulk-invite ─────────────────────────────────────────
// PM sends invite emails to multiple residents at once
router.post('/bulk-invite', requireAuth, requireRole(INTERNAL_ROLES), async (req: AuthRequest, res) => {
  try {
    const { residents, propertyId, projectId, buildingId } = req.body;

    if (!residents || !Array.isArray(residents) || residents.length === 0) {
      return res.status(400).json({ error: 'residents array is required' });
    }
    if (!propertyId || !projectId) {
      return res.status(400).json({ error: 'propertyId and projectId are required' });
    }

    const succeeded: { email: string; unitNumber?: string }[] = [];
    const failed: { email: string; reason: string }[] = [];

    let resendInstance: any = null;
    try {
      const { Resend } = await import('resend');
      resendInstance = new Resend(process.env.RESEND_API_KEY);
    } catch {}

    for (const resident of residents) {
      const email = (resident.email || '').trim().toLowerCase();
      const unitNumber = (resident.unitNumber || resident.unit || '').trim() || null;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failed.push({ email: email || '(missing)', reason: 'Invalid email address' });
        continue;
      }

      try {
        // Skip if user account already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.userEmail, email),
        });
        if (existingUser) {
          failed.push({ email, reason: 'User already has an account' });
          continue;
        }

        // Skip if a pending invite already exists for this email + property
        const existingInvite = await db.query.residentInvites.findFirst({
          where: and(
            eq(residentInvites.email, email),
            eq(residentInvites.propertyId, propertyId),
          ),
        });
        if (existingInvite && !existingInvite.acceptedAt) {
          failed.push({ email, reason: 'Invite already pending' });
          continue;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.insert(residentInvites).values({
          email,
          propertyId,
          projectId,
          buildingId: buildingId || null,
          unitNumber,
          token,
          expiresAt,
          invitedBy: req.user!.id,
        });

        const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;

        if (resendInstance) {
          try {
            await resendInstance.emails.send({
              from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
              to: email,
              subject: "You've been invited to Diligence",
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1e40af;">Welcome to Diligence</h2>
                  <p>Your property manager has invited you to stay updated on work happening at your property.</p>
                  ${unitNumber ? `<p><strong>Unit:</strong> ${unitNumber}</p>` : ''}
                  <p>Click the button below to set up your account. This link expires in 7 days.</p>
                  <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
                    Set Up My Account
                  </a>
                  <p style="color:#6b7280;font-size:14px;">If you didn't expect this email, you can ignore it.</p>
                </div>
              `,
            });
          } catch {}
        }

        succeeded.push({ email, unitNumber: unitNumber || undefined });
      } catch (err) {
        console.error(`Bulk invite error for ${email}:`, err);
        failed.push({ email, reason: 'Server error' });
      }
    }

    res.status(201).json({
      message: `${succeeded.length} invite${succeeded.length !== 1 ? 's' : ''} sent, ${failed.length} skipped`,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('Bulk invite error:', error);
    res.status(500).json({ error: 'Failed to process bulk invites' });
  }
});

export { router as residentsRouter };
