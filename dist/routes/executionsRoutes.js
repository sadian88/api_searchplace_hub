"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const executionsController_1 = require("../controllers/executionsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/categories', auth_1.authMiddleware, executionsController_1.getCategories);
router.post('/launch', auth_1.authMiddleware, executionsController_1.launchScraping);
router.get('/', auth_1.authMiddleware, executionsController_1.getExecutions);
router.get('/:id', auth_1.authMiddleware, executionsController_1.getExecutionById);
router.patch('/:id/status', auth_1.authMiddleware, executionsController_1.updateExecutionStatus);
router.get('/:id/results', auth_1.authMiddleware, executionsController_1.getExecutionResults);
exports.default = router;
//# sourceMappingURL=executionsRoutes.js.map