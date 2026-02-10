"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlaceStatus = exports.deletePlace = exports.updatePlace = exports.getPlaceById = exports.getAllPlaces = void 0;
const db_1 = require("../config/db");
const getAllPlaces = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const dataPromise = (0, db_1.query)('SELECT * FROM places ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countPromise = (0, db_1.query)('SELECT COUNT(*) FROM places');
        const [dataResult, countResult] = await Promise.all([dataPromise, countPromise]);
        const total = parseInt(countResult.rows[0].count);
        res.json({
            data: dataResult.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllPlaces = getAllPlaces;
const getPlaceById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await (0, db_1.query)('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Place not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPlaceById = getPlaceById;
const updatePlace = async (req, res) => {
    const { id } = req.params;
    const { title, phone, website, street, city, state, total_score, status } = req.body;
    try {
        const result = await (0, db_1.query)(`UPDATE places 
             SET title = $1, phone = $2, website = $3, street = $4, city = $5, state = $6, total_score = $7, status = $8, updated_at = NOW() 
             WHERE id = $9 RETURNING *`, [title, phone, website, street, city, state, total_score, status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Place not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePlace = updatePlace;
const deletePlace = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await (0, db_1.query)('DELETE FROM places WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Place not found' });
        }
        res.json({ message: 'Place deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deletePlace = deletePlace;
const updatePlaceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    // ... (rest of updatePlaceStatus remains same)
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