const express = require('express');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');
const { requireStepUp } = require('../stepUp/stepUp.middleware');
const aiConfigController = require('./aiConfig.controller');

const router = express.Router();

// Enforce ADMIN role across all AI config management routes
router.use(verifyJwt, requireRole('ADMIN'));

// Read global configuration, masked credentials, catalog, and health
router.get('/', aiConfigController.getConfiguration);

// Put/update provider API key (Gated with PUT_CREDENTIAL Step-Up Token)
router.put('/credentials/:provider', requireStepUp('PUT_CREDENTIAL'), aiConfigController.saveCredential);

// Delete stored provider API key (Gated with DELETE_CREDENTIAL Step-Up Token)
router.delete('/credentials/:provider', requireStepUp('DELETE_CREDENTIAL'), aiConfigController.deleteCredential);

// Manually probe/re-check an UNHEALTHY credential
router.post('/credentials/:provider/recheck', aiConfigController.recheckCredential);

// Create draft configuration
router.post('/drafts', aiConfigController.createDraft);

// Run golden test fixtures on candidate draft
router.post('/drafts/:version/test', aiConfigController.testDraft);

// Atomically activate candidate configuration (Gated with ACTIVATE_CONFIG Step-Up Token)
router.post('/activate', requireStepUp('ACTIVATE_CONFIG'), aiConfigController.activateConfiguration);

// Emergency configuration rollback (Gated with ROLLBACK_CONFIG Step-Up Token + Typed phrase)
router.post('/rollback', requireStepUp('ROLLBACK_CONFIG'), aiConfigController.rollbackConfiguration);

// Configuration version history
router.get('/history', aiConfigController.getHistory);

// Audit trail (strictly zero secrets)
router.get('/audit', aiConfigController.getAuditTrail);

module.exports = router;
