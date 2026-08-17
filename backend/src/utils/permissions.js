// Central permission catalog + default grants per base role.
// Admin always has every permission (hard bypass) — this can never be reduced,
// including by a custom role, so there's always a way to recover access.

const PERMISSIONS = {
  'teams.view': 'View teams',
  'teams.create': 'Create teams',
  'teams.edit': 'Edit teams (name, lead)',
  'teams.delete': 'Delete teams',
  'agents.view': 'View agents',
  'agents.create': 'Add agents',
  'agents.edit': 'Edit agents (role, status, team)',
  'agents.delete': 'Deactivate agents',
  'agents.reassign': 'Move an agent to a different team',
  'reports.view': 'View daily reports',
  'reports.edit_all': 'Edit any row in the daily report',
  'users.manage': 'Access User Management (create logins, assign base roles)',
  'roles.manage': 'Create and manage custom roles',
};

// A team_lead can never grant these to a role they create, even if they hold
// them personally — prevents privilege escalation through role delegation.
const NON_DELEGABLE = new Set(['teams.create', 'teams.delete', 'users.manage', 'roles.manage']);

// What a user gets when they have no custom role assigned.
const DEFAULTS = {
  team_lead: [
    'teams.view',
    'teams.edit',
    'agents.view',
    'agents.create',
    'agents.edit',
    'reports.view',
    'reports.edit_all',
    'roles.manage',
  ],
  agent: ['reports.view'],
};

function effectivePermissions(user) {
  if (!user) return [];
  if (user.role === 'admin') return Object.keys(PERMISSIONS);
  if (user.customRole) return user.customRole.permissions || [];
  return DEFAULTS[user.role] || [];
}

function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return effectivePermissions(user).includes(key);
}

module.exports = { PERMISSIONS, NON_DELEGABLE, DEFAULTS, effectivePermissions, hasPermission };
