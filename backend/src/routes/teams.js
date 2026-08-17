const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const ctrl = require('../controllers/teamsController');

const router = express.Router();

router.use(requireAuth);

// IMPORTANT: /grouped must be registered before /:id or Express will treat "grouped" as an id
router.get('/grouped', ctrl.getGroupedTeams);
router.get('/', ctrl.listTeams);
router.get('/:id', ctrl.getTeam);
router.post('/', requirePermission('teams.create'), ctrl.createTeam);
router.put('/:id', requirePermission('teams.edit'), ctrl.updateTeam);
router.delete('/:id', requirePermission('teams.delete'), ctrl.deleteTeam);

module.exports = router;
