const express = require('express');
const { listRoles, createRole, updateRole, deleteRole } = require('../controllers/rolesController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

router.get('/', listRoles);
router.post('/', requirePermission('roles.manage'), createRole);
router.put('/:id', requirePermission('roles.manage'), updateRole);
router.delete('/:id', requirePermission('roles.manage'), deleteRole);

module.exports = router;
