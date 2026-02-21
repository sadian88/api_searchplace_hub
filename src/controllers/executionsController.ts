import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

export const launchScraping = async (req: AuthRequest, res: Response) => {
    const {
        search_term, location, language, country, city, state,
        continent, postal_code, latitude, longitude, category,
        has_website, exact_name, search_type, radius, polygon_points
    } = req.body;

    try {
        // 1. Create execution record
        const executionResult = await query(
            `INSERT INTO scraping_executions 
      (user_id, search_term, location, language, country, city, state, continent, postal_code, latitude, longitude, category, has_website, exact_name, search_type, radius, polygon_points) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
            [
                req.user.id, search_term, location, language, country, city, state,
                continent, postal_code, latitude, longitude, category,
                has_website, exact_name, search_type || 'default', radius || null,
                polygon_points ? JSON.stringify(polygon_points) : null
            ]
        );

        const execution = executionResult.rows[0];

        // 2. Trigger real scraping via n8n webhook
        // We send the full execution data optimized for Apify consumption
        try {
            const webhookPayload = {
                id_scraping: execution.id,
                search_term: execution.search_term,
                max_leads: req.body.max_leads || 50,
                category: execution.category,
                has_website: execution.has_website,
                // Apify-ready geographic selection
                customSelection: execution.search_type === 'circle' ? {
                    type: 'circle',
                    lat: parseFloat(execution.latitude),
                    lng: parseFloat(execution.longitude),
                    radius: (execution.radius || 1) * 1000 // Convert km to meters
                } : execution.search_type === 'polygon' ? {
                    type: 'polygon',
                    points: JSON.parse(execution.polygon_points || '[]').map((p: any) => ({ lat: p[0], lng: p[1] }))
                } : null,
                // ONLY send text location if there is no custom selection (circle/polygon)
                // This prevents Apify from getting confused between the coordinates and the broad city name
                location: (execution.search_type === 'default' || !execution.search_type) ? execution.location : null,
                search_type: execution.search_type,
                latitude: parseFloat(execution.latitude),
                longitude: parseFloat(execution.longitude)
            };

            await axios.post('https://n8n.hubcapture.com/webhook/placessearch',
                webhookPayload,
                {
                    headers: {
                        'api-key': 'R5TSX1aBiQk4HCaXjEKGAZgrU2fhVt97EqFXiUMoV38',
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (webhookError: any) {
            console.error('Error triggering n8n webhook:', webhookError.message);
        }

        res.status(201).json({
            message: 'Scraping localized and triggered via n8n',
            execution_id: execution.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error during scraping launch' });
    }
};

export const getExecutions = async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        const dataPromise = query(
            'SELECT * FROM scraping_executions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [req.user.id, limit, offset]
        );
        const countPromise = query('SELECT COUNT(*) FROM scraping_executions WHERE user_id = $1', [req.user.id]);

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
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getExecutionById = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            'SELECT * FROM scraping_executions WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getExecutionResults = async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        // Verify execution belongs to user and check status
        const execCheck = await query(
            'SELECT id, status FROM scraping_executions WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (execCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        if (execCheck.rows[0].status !== 'terminado') {
            return res.status(403).json({
                message: 'Results available only for finished executions',
                current_status: execCheck.rows[0].status
            });
        }

        const dataPromise = query(
            `SELECT p.* FROM places p
       JOIN execution_results er ON p.id = er.place_id
       WHERE er.execution_id = $1
       ORDER BY p.title ASC
       LIMIT $2 OFFSET $3`,
            [req.params.id, limit, offset]
        );

        const countPromise = query(
            'SELECT COUNT(*) FROM execution_results WHERE execution_id = $1',
            [req.params.id]
        );

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
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateExecutionStatus = async (req: AuthRequest, res: Response) => {
    const { status } = req.body;

    if (!['running', 'terminado', 'fallido'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const result = await query(
            'UPDATE scraping_executions SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT name FROM search_categories ORDER BY name ASC');
        res.json(result.rows.map(r => r.name));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Success Rate (Executions with at least 1 result)
        const successRateQuery = await query(
            `SELECT 
                COUNT(*)::int as total,
                COUNT(CASE WHEN EXISTS (SELECT 1 FROM execution_results er WHERE er.execution_id = se.id) THEN 1 END)::int as successful
             FROM scraping_executions se 
             WHERE user_id = $1`,
            [req.user.id]
        );

        const { total, successful } = successRateQuery.rows[0];
        const rate = total > 0 ? Math.round((successful / total) * 10000) / 100 : 0;

        // 2. Timeline (Last 14 days)
        const timelineQuery = await query(
            `WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '13 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date as date
            )
            SELECT 
                d.date,
                COUNT(se.id)::int as count
            FROM days d
            LEFT JOIN scraping_executions se ON d.date = se.created_at::date AND se.user_id = $1
            GROUP BY d.date
            ORDER BY d.date ASC`,
            [req.user.id]
        );

        res.json({
            successRate: rate,
            timeline: timelineQuery.rows.map(r => ({
                date: r.date,
                count: r.count
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error fetching dashboard stats' });
    }
};
