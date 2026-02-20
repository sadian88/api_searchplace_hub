const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrate() {
    try {
        console.log('Applying migrations...');
        await pool.query(`
      ALTER TABLE scraping_executions ADD COLUMN IF NOT EXISTS search_type TEXT DEFAULT 'default';
      ALTER TABLE scraping_executions ADD COLUMN IF NOT EXISTS radius DECIMAL;
      ALTER TABLE scraping_executions ADD COLUMN IF NOT EXISTS polygon_points JSONB;
    `);
        console.log('Migrations applied successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error applying migrations:', err);
        process.exit(1);
    }
}

migrate();
