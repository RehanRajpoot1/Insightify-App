const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('changeme123', 10);

  const campaign = await prisma.campaign.upsert({
    where: { tag: 'TR-1-ENAF' },
    update: {},
    create: { name: 'English Conversion', tag: 'TR-1-ENAF' },
  });

  const teamsData = [
    {
      name: "Maheen's Team",
      lead: { fullName: 'Maheen Amjad Raja', crmName: 'maheen_am', email: 'maheen@roster.local' },
      agents: [
        { fullName: 'Syed Arishiya Hassan', crmName: 'arshiya_sy', email: 'arshiya@roster.local', status: 'active' },
        { fullName: 'Bilal Ahmed Khokhar', crmName: 'bilal_ah', email: 'bilal@roster.local', status: 'leave' },
        { fullName: 'Fatima Zahra Noor', crmName: 'fatima_za', email: 'fatima@roster.local', status: 'active' },
      ],
    },
    {
      name: "Mustafa's Team",
      lead: { fullName: 'Mustafa Farooq Khan', crmName: 'mustafa_fa', email: 'mustafa@roster.local' },
      agents: [
        { fullName: 'Ayesha Siddiqa Malik', crmName: 'ayesha_si', email: 'ayesha@roster.local', status: 'active' },
        { fullName: 'Hamza Tariq Awan', crmName: 'hamza_ta', email: 'hamza@roster.local', status: 'inactive' },
        { fullName: 'Zainab Fatima Sheikh', crmName: 'zainab_fa', email: 'zainab@roster.local', status: 'active' },
        { fullName: 'Usman Ghani Butt', crmName: 'usman_gh', email: 'usman@roster.local', status: 'active' },
      ],
    },
    {
      name: "Azeem's Team",
      lead: { fullName: 'Azeem Raza Chaudhry', crmName: 'azeem_ra', email: 'azeem@roster.local' },
      agents: [
        { fullName: 'Sana Rehman Qureshi', crmName: 'sana_re', email: 'sana@roster.local', status: 'active' },
        { fullName: 'Danish Iqbal Warraich', crmName: 'danish_iq', email: 'danish@roster.local', status: 'leave' },
        { fullName: 'Nimra Yousaf Baig', crmName: 'nimra_yo', email: 'nimra@roster.local', status: 'active' },
        { fullName: 'Owais Anjum Dar', crmName: 'owais_an', email: 'owais@roster.local', status: 'active' },
      ],
    },
  ];

  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { campaignId_name: { campaignId: campaign.id, name: t.name } },
      update: {},
      create: { campaignId: campaign.id, name: t.name },
    });

    const lead = await prisma.user.upsert({
      where: { email: t.lead.email },
      update: {},
      create: { ...t.lead, role: 'team_lead', teamId: team.id, passwordHash },
    });

    await prisma.team.update({ where: { id: team.id }, data: { teamLeadId: lead.id } });

    for (const a of t.agents) {
      await prisma.user.upsert({
        where: { email: a.email },
        update: {},
        create: { ...a, role: 'agent', teamId: team.id, passwordHash },
      });
    }
  }

  // A top-level admin, not tied to a team
  await prisma.user.upsert({
    where: { email: 'admin@roster.local' },
    update: {},
    create: {
      fullName: 'Rehan Admin',
      crmName: 'rehan_admin',
      email: 'admin@roster.local',
      role: 'admin',
      passwordHash,
    },
  });

  console.log('Seed complete. Login with admin@roster.local / changeme123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
