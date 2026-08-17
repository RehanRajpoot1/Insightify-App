const prisma = require('../config/db');
const { PERMISSIONS, NON_DELEGABLE, effectivePermissions } = require('../utils/permissions');

const VALID_KEYS = new Set(Object.keys(PERMISSIONS));

function sanitizePermissions(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list)].filter((k) => VALID_KEYS.has(k));
}

// What the requester is allowed to hand out to a role they create/edit.
// Admin: anything. Team lead: only permissions they currently hold themselves,
// minus the set that can never be delegated (prevents privilege escalation).
function delegableSet(user) {
  if (user.role === 'admin') return new Set(Object.keys(PERMISSIONS));
  const mine = new Set(effectivePermissions(user));
  for (const k of NON_DELEGABLE) mine.delete(k);
  return mine;
}

// GET /api/roles — global roles + whatever team the requester belongs to
async function listRoles(req, res) {
  const where =
    req.user.role === 'admin'
      ? {}
      : { OR: [{ scope: 'global' }, { teamId: req.user.teamId || '__none__' }] };

  const roles = await prisma.role.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
  res.json({ roles, catalog: PERMISSIONS, nonDelegable: [...NON_DELEGABLE] });
}

// POST /api/roles
async function createRole(req, res) {
  const { name, permissions } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Role name is required' });

  const allowed = delegableSet(req.user);
  const requested = sanitizePermissions(permissions);
  const granted = requested.filter((k) => allowed.has(k));

  if (granted.length === 0) {
    return res.status(400).json({ error: 'No valid, delegable permissions selected' });
  }

  let scope = 'team';
  let teamId = req.user.teamId || null;

  if (req.user.role === 'admin') {
    // Admin may create a reusable global role, or pin one to a specific team.
    scope = req.body.scope === 'team' ? 'team' : 'global';
    teamId = scope === 'team' ? req.body.team_id || null : null;
  } else if (!teamId) {
    return res.status(400).json({ error: 'You must belong to a team to create a role' });
  }

  const role = await prisma.role.create({
    data: { name: name.trim(), scope, teamId, permissions: granted, createdById: req.user.id },
  });
  res.status(201).json({ role });
}

async function findEditableRole(req) {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return { error: 404 };
  if (req.user.role === 'admin') return { role };
  if (role.scope === 'team' && role.teamId === req.user.teamId) return { role };
  return { error: 403 };
}

// PUT /api/roles/:id
async function updateRole(req, res) {
  const { role, error } = await findEditableRole(req);
  if (error) return res.status(error).json({ error: error === 404 ? 'Role not found' : 'Forbidden' });

  const allowed = delegableSet(req.user);
  const data = {};
  if (req.body.name && req.body.name.trim()) data.name = req.body.name.trim();
  if (req.body.permissions) {
    const requested = sanitizePermissions(req.body.permissions);
    data.permissions = requested.filter((k) => allowed.has(k));
  }

  const updated = await prisma.role.update({ where: { id: role.id }, data });
  res.json({ role: updated });
}

// DELETE /api/roles/:id
async function deleteRole(req, res) {
  const { role, error } = await findEditableRole(req);
  if (error) return res.status(error).json({ error: error === 404 ? 'Role not found' : 'Forbidden' });

  await prisma.role.delete({ where: { id: role.id } });
  res.json({ ok: true });
}

module.exports = { listRoles, createRole, updateRole, deleteRole };
