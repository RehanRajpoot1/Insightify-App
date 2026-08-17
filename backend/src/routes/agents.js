const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requirePermission, requireOwnTeamOrSelf } = require('../middleware/rbac');
const agents = require('../controllers/agentsController');
const bulkImport = require('../controllers/bulkImportController');
const { exportAgents } = require('../controllers/exportController');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(requireAuth);

// Static/specific routes first, then dynamic /:id routes
router.post('/crm-name-suggest', requirePermission('agents.create'), agents.suggestCrmName);
router.post('/bulk-import', requireRole('admin'), upload.single('file'), bulkImport.previewImport);
router.post('/bulk-import/confirm', requireRole('admin'), bulkImport.confirmImport);
router.patch('/bulk-reassign', requireRole('admin'), agents.bulkReassign);
router.get('/export', requireRole('admin', 'team_lead'), exportAgents);

router.get('/', agents.listAgents);
router.get('/:id', requireOwnTeamOrSelf, agents.getAgent);
router.post('/', requirePermission('agents.create'), agents.createAgent);
router.put('/:id', requireOwnTeamOrSelf, agents.updateAgent);
router.delete('/:id', requirePermission('agents.delete'), agents.deleteAgent);
router.patch('/:id/reassign', requirePermission('agents.reassign'), agents.reassignAgent);

module.exports = router;
