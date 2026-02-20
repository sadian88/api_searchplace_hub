"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlaceStatus = exports.getAllPlaces = void 0;
const db_1 = require("../config/db");
const getAllPlaces = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM places ORDER BY created_at DESC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllPlaces = getAllPlaces;
const updatePlaceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['cliente', 'por visita', 'visitado', 'descartado'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        const result = await (0, db_1.query)('UPDATE places SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Place not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePlaceStatus = updatePlaceStatus;
//# sourceMappingURL=placesController.js.map