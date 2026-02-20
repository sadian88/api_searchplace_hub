"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const executionsController_1 = require("../controllers/executionsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/launch', auth_1.authMiddleware, executionsController_1.launchScraping);
router.get('/', auth_1.authMiddleware, executionsController_1.getExecutions);
exports.default = router;
//# sourceMappingURL=executionsRoutes.js.map