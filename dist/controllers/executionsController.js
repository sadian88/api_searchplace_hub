"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.updateExecutionStatus = exports.getExecutionResults = exports.getExecutionById = exports.getExecutions = exports.launchScraping = void 0;
const db_1 = require("../config/db");
const axios_1 = __importDefault(require("axios"));
const launchScraping = async (req, res) => {
    const { search_term, location, language, country, city, state, continent, postal_code, latitude, longitude, category, has_website, exact_name } = req.body;
    try {
        // 1. Create execution record
        const executionResult = await (0, db_1.query)(`INSERT INTO scraping_executions 
      (user_id, search_term, location, language, country, city, state, continent, postal_code, latitude, longitude, category, has_website, exact_name) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`, [
            req.user.id, search_term, location, language, country, city, state,
            continent, postal_code, latitude, longitude, category,
            has_website, exact_name
        ]);
        const execution = executionResult.rows[0];
        // 2. Trigger real scraping via n8n webhook
        // We send the execution.id as id_scraping to n8n
        try {
            await axios_1.default.post('https://n8n.hubcapture.com/webhook-test/placessearch', { id_scraping: execution.id }, {
                headers: {
                    'api-key': 'R5TSX1aBiQk4HCaXjEKGAZgrU2fhVt97EqFXiUMoV38',
                    'Content-Type': 'application/json'
                }
            });
        }
        catch (webhookError) {
            console.error('Error triggering n8n webhook:', webhookError.message);
            // We still return 201 because the execution was created, but we log the error
        }
        res.status(201).json({
            message: 'Scraping localized and triggered via n8n',
            execution_id: execution.id
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error during scraping launch' });
    }
};
exports.launchScraping = launchScraping;
const getExecutions = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const dataPromise = (0, db_1.query)('SELECT * FROM scraping_executions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]);
        const countPromise = (0, db_1.query)('SELECT COUNT(*) FROM scraping_executions WHERE user_id = $1', [req.user.id]);
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
exports.getExecutions = getExecutions;
const getExecutionById = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM scraping_executions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExecutionById = getExecutionById;
const getExecutionResults = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        // Verify execution belongs to user and check status
        const execCheck = await (0, db_1.query)('SELECT id, status FROM scraping_executions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (execCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }
        if (execCheck.rows[0].status !== 'terminado') {
            return res.status(403).json({
                message: 'Results available only for finished executions',
                current_status: execCheck.rows[0].status
            });
        }
        const dataPromise = (0, db_1.query)(`SELECT p.* FROM places p
       JOIN execution_results er ON p.id = er.place_id
       WHERE er.execution_id = $1
       ORDER BY p.title ASC
       LIMIT $2 OFFSET $3`, [req.params.id, limit, offset]);
        const countPromise = (0, db_1.query)('SELECT COUNT(*) FROM execution_results WHERE execution_id = $1', [req.params.id]);
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
exports.getExecutionResults = getExecutionResults;
const updateExecutionStatus = async (req, res) => {
    const { status } = req.body;
    if (!['running', 'terminado', 'fallido'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        const result = await (0, db_1.query)('UPDATE scraping_executions SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateExecutionStatus = updateExecutionStatus;
const getCategories = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT name FROM search_categories ORDER BY name ASC');
        res.json(result.rows.map(r => r.name));
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCategories = getCategories;
//# sourceMappingURL=executionsController.js.map