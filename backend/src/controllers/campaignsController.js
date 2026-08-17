const prisma = require('../config/db');

async function listCampaigns(req, res) {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { teams: true } } },
  });
  res.json({ campaigns });
}

async function createCampaign(req, res) {
  const { name, tag, description } = req.body;
  if (!name || !tag) return res.status(400).json({ error: 'name and tag are required' });

  const campaign = await prisma.campaign.create({ data: { name, tag, description } });
  res.status(201).json({ campaign });
}

async function updateCampaign(req, res) {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { name, description, isActive },
  });
  res.json({ campaign });
}

async function deleteCampaign(req, res) {
  const { id } = req.params;
  await prisma.campaign.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listCampaigns, createCampaign, updateCampaign, deleteCampaign };
