const prisma = require('../config/db');

async function listTeams(req, res) {
  const { campaign_id, search } = req.query;

  // Non-admins only ever see their own team
  const scopeTeamId = req.user.role === 'admin' ? undefined : req.user.teamId || 'none';

  const teams = await prisma.team.findMany({
    where: {
      id: scopeTeamId,
      campaignId: campaign_id || undefined,
      name: search ? { contains: search, mode: 'insensitive' } : undefined,
    },
    include: { teamLead: { select: { id: true, fullName: true, crmName: true } }, _count: { select: { agents: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ teams });
}

async function getTeam(req, res) {
  const { id } = req.params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      teamLead: { select: { id: true, fullName: true, crmName: true } },
      agents: { select: { id: true, fullName: true, crmName: true, status: true, role: true } },
    },
  });
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ team });
}

async function createTeam(req, res) {
  const { campaignId, name, teamLeadId } = req.body;
  if (!campaignId || !name) return res.status(400).json({ error: 'campaignId and name are required' });

  const team = await prisma.team.create({ data: { campaignId, name, teamLeadId } });
  res.status(201).json({ team });
}

async function updateTeam(req, res) {
  const { id } = req.params;
  const { name, teamLeadId } = req.body;

  if (req.user.role === 'team_lead' && id !== req.user.teamId) {
    return res.status(403).json({ error: 'Forbidden — not your team' });
  }

  const team = await prisma.team.update({ where: { id }, data: { name, teamLeadId } });
  res.json({ team });
}

async function deleteTeam(req, res) {
  const { id } = req.params;
  await prisma.team.delete({ where: { id } });
  res.status(204).send();
}

/**
 * GET /api/teams/grouped?campaign_tag=TR-1-ENAF
 * Powers the Kanban board / grouped table view in the frontend.
 */
async function getGroupedTeams(req, res) {
  const { campaign_tag } = req.query;
  if (!campaign_tag) return res.status(400).json({ error: 'campaign_tag is required' });

  const campaign = await prisma.campaign.findUnique({ where: { tag: campaign_tag } });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const teams = await prisma.team.findMany({
    where: {
      campaignId: campaign.id,
      id: req.user.role === 'admin' ? undefined : req.user.teamId || 'none',
    },
    include: {
      teamLead: { select: { id: true, fullName: true, crmName: true } },
      agents: {
        select: {
          id: true, fullName: true, crmName: true, email: true, phone: true,
          status: true, role: true, teamId: true, dateJoined: true,
        },
        orderBy: { fullName: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    campaign: { name: campaign.name, tag: campaign.tag },
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      team_lead: t.teamLead,
      agents: t.agents,
    })),
  });
}

module.exports = { listTeams, getTeam, createTeam, updateTeam, deleteTeam, getGroupedTeams };
