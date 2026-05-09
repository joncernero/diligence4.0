import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { organizations } from '../schema/users';
import { eq } from 'drizzle-orm';
import { SubscriptionTier } from '../schema/users';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    department?: string;
    orgId?: number;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
      department?: string;
      orgId?: number;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// All internal (non-resident) staff roles
export const INTERNAL_ROLES = ['admin', 'pm', 'super', 'pe', 'pc', 'gc', 'sub', 'client_view'];

// ============================================
// FEATURE FLAGS — tier defaults
// Enterprise features are always on for enterprise orgs; professional for professional+.
// Individual flags in org_settings.features can override these defaults.
// ============================================
const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  standard: [],
  professional: ['custom_branding', 'advanced_exports', 'resident_portal'],
  enterprise: [
    'custom_branding',
    'advanced_exports',
    'resident_portal',
    'white_label',
    'sso',
    'advanced_analytics',
    'dedicated_support',
  ],
};

/**
 * Middleware that checks whether the requesting org has a given feature enabled.
 * Must be used AFTER requireAuth.
 *
 * Usage:
 *   router.get('/export', requireAuth, requireFeature('advanced_exports'), handler)
 *
 * Feature access is determined by:
 *   1. Tier defaults (e.g., all enterprise orgs get 'advanced_exports')
 *   2. Explicit overrides in org_settings.features (true = on, false = off)
 */
export const requireFeature = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.orgId) {
      return res.status(403).json({ error: 'Feature not available: no org context' });
    }

    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, req.user.orgId),
        columns: { subscriptionTier: true, orgSettings: true },
      });

      if (!org) {
        return res.status(403).json({ error: 'Organization not found' });
      }

      const tier = (org.subscriptionTier as SubscriptionTier) || 'standard';
      const tierFeatures = TIER_FEATURES[tier] ?? [];
      const overrides = (org.orgSettings?.features ?? {}) as Record<string, boolean>;

      // Explicit override takes precedence over tier default
      let hasAccess: boolean;
      if (feature in overrides) {
        hasAccess = overrides[feature];
      } else {
        hasAccess = tierFeatures.includes(feature);
      }

      // In non-production environments, all features are enabled so prospective
      // customers can evaluate the full product during development/staging.
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev && !hasAccess) {
        return res.status(403).json({
          error: `Feature '${feature}' is not available on your current plan.`,
          currentTier: tier,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      console.error('requireFeature error:', error);
      return res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};

export const requireRole = (allowedRoles: string[], allowedDepts?: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check role
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    // Check department if specified
    if (allowedDepts && allowedDepts.length > 0) {
      if (!req.user.department || !allowedDepts.includes(req.user.department)) {
        return res.status(403).json({ 
          error: 'Department access denied',
          required: allowedDepts,
          current: req.user.department
        });
      }
    }

    next();
  };
};
