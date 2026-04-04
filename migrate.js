/**
 * Migration: rename table `leaderboard_schema` → `scores`
 *
 * Safe to run multiple times (idempotent):
 *   - If `leaderboard_schema` exists and `scores` does not → rename it.
 *   - If `scores` already exists → nothing to do.
 *   - If neither table exists → nothing to do.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'leaderboard_schema'
        ) AS old_exists,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'scores'
        ) AS new_exists
    `);

    const { old_exists, new_exists } = rows[0];

    if (new_exists) {
      console.log('migrate: table "scores" already exists — nothing to do.');
    } else if (old_exists) {
      await client.query('ALTER TABLE leaderboard_schema RENAME TO scores');
      console.log('migrate: renamed "leaderboard_schema" → "scores".');
    } else {
      console.log('migrate: neither "leaderboard_schema" nor "scores" found — nothing to do.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('migrate: fatal error —', err);
  process.exit(1);
});
