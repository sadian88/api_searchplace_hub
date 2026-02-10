"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const placesController_1 = require("../controllers/placesController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authMiddleware, placesController_1.getAllPlaces);
router.patch('/:id/status', auth_1.authMiddleware, placesController_1.updatePlaceStatus);
exports.default = router;
//# sourceMappingURL=placesRoutes.js.map