import { eq, inArray } from 'drizzle-orm';

/**
 * Middleware: Inject business scope into request
 * - Owner: reads businessId from query param or header; null = all businesses
 * - Kasir: auto-set to their assigned business; rejects cross-business access
 */
export function injectBusinessScope(req, res, next) {
  if (!req.user) return next();

  const role = req.user.role;
  const assignedBusinessIds = req.user.assignedBusinessIds || [];

  if (role === 'owner') {
    // Owner can pick a business via query param or header, or see all
    const bizId = req.query.businessId || req.headers['x-business-id'];
    req.businessId = bizId ? parseInt(bizId) : null; // null = all businesses
    req.businessIds = null; // owner can see all
  } else {
    // Kasir: auto-scope to assigned business(es)
    const requestedBizId = req.query.businessId || req.headers['x-business-id'];

    if (requestedBizId) {
      const parsed = parseInt(requestedBizId);
      if (!assignedBusinessIds.includes(parsed)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke bisnis ini.' });
      }
      req.businessId = parsed;
    } else {
      // Default to first assigned business
      req.businessId = assignedBusinessIds.length > 0 ? assignedBusinessIds[0] : null;
    }
    req.businessIds = assignedBusinessIds;
  }

  next();
}

/**
 * Helper: Build a Drizzle where clause for business filtering
 * @param {object} req - Express request with businessId
 * @param {object} businessIdColumn - The Drizzle column reference for business_id
 * @returns {object|null} - A Drizzle eq() clause or null (no filter)
 */
export function getBusinessFilter(req, businessIdColumn) {
  if (req.businessId) {
    return eq(businessIdColumn, req.businessId);
  }
  if (req.businessIds && req.businessIds.length > 0) {
    return inArray(businessIdColumn, req.businessIds);
  }
  return null; // No filter (owner viewing all)
}
