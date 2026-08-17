const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateCrmName } = require('../utils/crmNameGenerator');

// Never return passwordHash to the client.
const SAFE_AGENT_FIELDS = {
  id: true, fullName: true, crmName: true, email: true, phone: true,
  role: true, status: true, teamId: true, dateJoined: true,
  customRoleId: true, customRole: { select: { id: true, name: true } },
};

async function listAgents(req, res) {
  const { team_id, status, search, page = 1, limit = 25 } = req.query;

  // Non-admins only ever see their own team
  const scopeTeamId = req.user.role === 'admin' ? team_id : req.user.teamId;

  const where = {
    teamId: scopeTeamId || undefined,
    status: status || undefined,
    OR: search
      ? [
          { fullName: { contains: search, mode: 'insensitive' } },
          { crmName: { contains: search, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const [agents, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, crmName: true, email: true, phone: true,
        role: true, status: true, teamId: true, dateJoined: true,
        customRoleId: true, customRole: { select: { id: true, name: true } },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { fullName: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ agents, total, page: Number(page), limit: Number(limit) });
}

async function getAgent(req, res) {
  const { id } = req.params;
  const agent = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, crmName: true, email: true, phone: true,
      role: true, status: true, teamId: true, dateJoined: true, avatarUrl: true,
    },
  });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
}

async function suggestCrmName(req, res) {
  const { full_name } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name is required' });

  const existing = (await prisma.user.findMany({ select: { crmName: true } })).map((u) => u.crmName);
  const suggestion = generateCrmName(full_name, existing);
  res.json({ suggestion });
}

async function validateAssignableRole(req, customRoleId) {
  if (!customRoleId) return { ok: true, value: null };
  const role = await prisma.role.findUnique({ where: { id: customRoleId } });
  if (!role) return { ok: false, error: 'Role not found' };
  if (req.user.role === 'admin') return { ok: true, value: role.id };
  if (role.scope === 'global' || role.teamId === req.user.teamId) return { ok: true, value: role.id };
  return { ok: false, error: 'You cannot assign a role outside your team' };
}

async function createAgent(req, res) {
  const { fullName, crmName, email, phone, teamId, password, customRoleId } = req.body;
  // Only an admin may create an admin/team_lead account — everyone else can only create agents.
  const role = req.user.role === 'admin' ? req.body.role || 'agent' : 'agent';
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'fullName, email, and password are required' });
  }

  const roleCheck = await validateAssignableRole(req, customRoleId);
  if (!roleCheck.ok) return res.status(400).json({ error: roleCheck.error });

  const existing = (await prisma.user.findMany({ select: { crmName: true } })).map((u) => u.crmName);
  const finalCrmName = crmName || generateCrmName(fullName, existing);

  const passwordHash = await bcrypt.hash(password, 10);

  const agent = await prisma.user.create({
    data: {
      fullName, crmName: finalCrmName, email, phone, teamId, role, passwordHash,
      customRoleId: roleCheck.value,
    },
  });

  res.status(201).json({
    agent: { id: agent.id, fullName: agent.fullName, crmName: agent.crmName, email: agent.email },
  });
}

async function updateAgent(req, res) {
  const { id } = req.params;
  const { fullName, crmName, email, phone, status, role, customRoleId, password } = req.body;

  // Agents can only touch their own contact info, not role/status/team/customRole/password
  if (req.user.role === 'agent') {
    const agent = await prisma.user.update({ where: { id }, data: { email, phone }, select: SAFE_AGENT_FIELDS });
    return res.json({ agent });
  }

  const data = { fullName, crmName, email, phone, status };
  // Only an admin may change base role (admin/team_lead/agent) on an existing account.
  if (req.user.role === 'admin' && role !== undefined) data.role = role;
  if (customRoleId !== undefined) {
    const roleCheck = await validateAssignableRole(req, customRoleId);
    if (!roleCheck.ok) return res.status(400).json({ error: roleCheck.error });
    data.customRoleId = roleCheck.value;
  }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const agent = await prisma.user.update({ where: { id }, data, select: SAFE_AGENT_FIELDS });
  res.json({ agent });
}

async function deleteAgent(req, res) {
  const { id } = req.params;
  // Soft delete — preserves history/roster audit trail
  const agent = await prisma.user.update({
    where: { id },
    data: { status: 'inactive' },
    select: SAFE_AGENT_FIELDS,
  });
  res.json({ agent });
}

async function reassignAgent(req, res) {
  const { id } = req.params;
  const { team_id } = req.body;

  const agent = await prisma.user.update({
    where: { id },
    data: { teamId: team_id },
    select: SAFE_AGENT_FIELDS,
  });
  res.json({ agent });
}

async function bulkReassign(req, res) {
  const { agent_ids, team_id } = req.body;
  if (!Array.isArray(agent_ids) || !team_id) {
    return res.status(400).json({ error: 'agent_ids (array) and team_id are required' });
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: agent_ids } },
    data: { teamId: team_id },
  });

  res.json({ updated: result.count });
}

module.exports = {
  listAgents, getAgent, createAgent, updateAgent, deleteAgent,
  reassignAgent, bulkReassign, suggestCrmName,
};
