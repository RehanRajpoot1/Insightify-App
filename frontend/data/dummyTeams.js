// Stand-in for GET /api/teams/grouped?campaign_tag=TR-1-ENAF
// Swap this out for a real fetch() once the backend is live (see lib/api.js).

export const campaign = {
  name: 'English Conversion',
  tag: 'TR-1-ENAF',
};

export const teams = [
  {
    id: 'team-1',
    name: "Maheen's Team",
    color: '#3452FF',
    lead: 'Maheen Amjad Raja',
    agents: [
      { id: 'a1', full_name: 'Maheen Amjad Raja', crm_name: 'maheen_am', role: 'Team Lead', status: 'active', joined: 'Feb 2023' },
      { id: 'a2', full_name: 'Syed Arishiya Hassan', crm_name: 'arshiya_sy', role: 'Agent', status: 'active', joined: 'Jun 2023' },
      { id: 'a3', full_name: 'Bilal Ahmed Khokhar', crm_name: 'bilal_ah', role: 'Agent', status: 'leave', joined: 'Sep 2023' },
      { id: 'a4', full_name: 'Fatima Zahra Noor', crm_name: 'fatima_za', role: 'Agent', status: 'active', joined: 'Jan 2024' },
    ],
  },
  {
    id: 'team-2',
    name: "Mustafa's Team",
    color: '#17A673',
    lead: 'Mustafa Farooq Khan',
    agents: [
      { id: 'a5', full_name: 'Mustafa Farooq Khan', crm_name: 'mustafa_fa', role: 'Team Lead', status: 'active', joined: 'Mar 2023' },
      { id: 'a6', full_name: 'Ayesha Siddiqa Malik', crm_name: 'ayesha_si', role: 'Agent', status: 'active', joined: 'May 2023' },
      { id: 'a7', full_name: 'Hamza Tariq Awan', crm_name: 'hamza_ta', role: 'Agent', status: 'inactive', joined: 'Aug 2023' },
      { id: 'a8', full_name: 'Zainab Fatima Sheikh', crm_name: 'zainab_fa', role: 'Agent', status: 'active', joined: 'Nov 2023' },
      { id: 'a9', full_name: 'Usman Ghani Butt', crm_name: 'usman_gh', role: 'Agent', status: 'active', joined: 'Feb 2024' },
    ],
  },
  {
    id: 'team-3',
    name: "Azeem's Team",
    color: '#E8A83C',
    lead: 'Azeem Raza Chaudhry',
    agents: [
      { id: 'a10', full_name: 'Azeem Raza Chaudhry', crm_name: 'azeem_ra', role: 'Team Lead', status: 'active', joined: 'Jan 2023' },
      { id: 'a11', full_name: 'Sana Rehman Qureshi', crm_name: 'sana_re', role: 'Agent', status: 'active', joined: 'Apr 2023' },
      { id: 'a12', full_name: 'Danish Iqbal Warraich', crm_name: 'danish_iq', role: 'Agent', status: 'leave', joined: 'Jul 2023' },
      { id: 'a13', full_name: 'Nimra Yousaf Baig', crm_name: 'nimra_yo', role: 'Agent', status: 'active', joined: 'Oct 2023' },
      { id: 'a14', full_name: 'Owais Anjum Dar', crm_name: 'owais_an', role: 'Agent', status: 'active', joined: 'Dec 2023' },
    ],
  },
];
