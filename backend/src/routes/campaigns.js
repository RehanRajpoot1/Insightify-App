const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/campaignsController');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listCampaigns);
router.post('/', requireRole('admin'), ctrl.createCampaign);
router.put('/:id', requireRole('admin'), ctrl.updateCampaign);
router.delete('/:id', requireRole('admin'), ctrl.deleteCampaign);

module.exports = router;
