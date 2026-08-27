const express = require('express');
const { listOptions, addOption } = require('../controllers/reportOptionsController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

router.get('/', listOptions);
router.post('/', requirePermission('reports.edit_all'), addOption);

module.exports = router;
