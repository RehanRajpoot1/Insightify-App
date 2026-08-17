const prisma = require('../config/db');
const { hasPermission } = require('../utils/permissions');

/** Restrict a route to one or more roles. */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }
    next();
  };
}

/** Restrict a route to a specific permission key (admin always passes). */
function requirePermission(key) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!hasPermission(req.user, key)) {
      return res.status(403).json({ error: `Forbidden — missing permission: ${key}` });
    }
    next();
  };
}

/**
 * Allows: admin (always), team_lead (only for agents in their own team),
 * and the agent themself (only for their own record).
 * Expects req.params.id to be the target user's id.
 */
async function requireOwnTeamOrSelf(req, res, next) {
  if (req.user.role === 'admin') return next();

  const targetId = req.params.id;

  if (req.user.role === 'agent' && targetId === req.user.id) return next();

  if (req.user.role === 'team_lead') {
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { teamId: true } });
    if (target && target.teamId && target.teamId === req.user.teamId) return next();
  }

  return res.status(403).json({ error: 'Forbidden — not your team' });
}

module.exports = { requireRole, requirePermission, requireOwnTeamOrSelf };
