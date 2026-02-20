"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutions = exports.launchScraping = void 0;
const db_1 = require("../config/db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        // 2. Simulate scraping by reading from data.json (as requested)
        // In a real scenario, this would trigger a professional scraper
        const dataPath = path_1.default.join(__dirname, '../../../data.json');
        const rawData = fs_1.default.readFileSync(dataPath, 'utf8');
        const placesData = JSON.parse(rawData);
        // 3. Save places and link to execution
        for (const place of placesData) {
            // Use google_place_id to avoid duplicates in the global places table
            // In data.json, the place_id is part of the URL, we can extract it or use a hash
            const urlParams = new URLSearchParams(place.url.split('?')[1]);
            const gPlaceId = urlParams.get('query_place_id') || `custom_${Math.random().toString(36).substr(2, 9)}`;
            const upsertPlace = await (0, db_1.query)(`INSERT INTO places 
        (google_place_id, title, image_url, total_score, reviews_count, street, city, state, country_code, website, phone, category_name, maps_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (google_place_id) DO UPDATE SET
          title = EXCLUDED.title,
          image_url = EXCLUDED.image_url,
          total_score = EXCLUDED.total_score,
          reviews_count = EXCLUDED.reviews_count,
          updated_at = NOW()
        RETURNING id`, [
                gPlaceId, place.title, place.imageUrl, place.totalScore,
                place.reviewsCount, place.street, place.city, place.state,
                place.countryCode, place.website, place.phone, place.categoryName, place.url
            ]);
            const placeId = upsertPlace.rows[0].id;
            await (0, db_1.query)('INSERT INTO execution_results (execution_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [execution.id, placeId]);
        }
        res.status(201).json({
            message: 'Scraping localized and processed',
            execution_id: execution.id,
            count: placesData.length
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error during scraping simulation' });
    }
};
exports.launchScraping = launchScraping;
const getExecutions = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM scraping_executions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExecutions = getExecutions;
//# sourceMappingURL=executionsController.js.map