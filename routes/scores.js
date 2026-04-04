const express = require('express');
const router = express.Router();
const db = require('../db');
const gameConfig = require('../gameConfig');
const { validateKey } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const VALID_DEVICE_TYPES = new Set(['mobile', 'desktop', 'arcade']);

// POST /scores — submit a score
router.post('/', rateLimit, validateKey, async (req, res) => {
  const { gameId, playerName, score, deviceType } = req.body;

  if (!gameId || !playerName || score === undefined || !deviceType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!VALID_DEVICE_TYPES.has(deviceType)) {
    return res.status(400).json({ error: 'Invalid deviceType' });
  }

  const sanitizedName = String(playerName).replace(/<[^>]*>/g, '').trim();
  if (sanitizedName.length === 0 || sanitizedName.length > 32) {
    return res.status(400).json({ error: 'playerName must be 1–32 characters' });
  }

  const config = gameConfig[gameId];
  if (!config) {
    return res.status(400).json({ error: 'Unknown gameId' });
  }

  const numericScore = parseInt(score, 10);
  if (isNaN(numericScore) || numericScore < config.min || numericScore > config.max) {
    return res.status(400).json({ error: 'Score out of valid range' });
  }

  try {
    const result = await db.query(
      'INSERT INTO scores (game_id, player_name, score, device_type) VALUES ($1, $2, $3, $4) RETURNING id',
      [gameId, sanitizedName, numericScore, deviceType]
    );
    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('POST /scores error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /scores/:gameId — fetch top scores
router.get('/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const { device, limit: limitParam } = req.query;

  if (!device || !VALID_DEVICE_TYPES.has(device)) {
    return res.status(400).json({ error: 'device query param is required and must be mobile, desktop, or arcade' });
  }

  const limit = Math.min(parseInt(limitParam, 10) || 10, 100);

  try {
    const result = await db.query(
      `SELECT player_name, score, created_at
       FROM scores
       WHERE game_id = $1 AND device_type = $2
       ORDER BY score DESC
       LIMIT $3`,
      [gameId, device, limit]
    );

    const scores = result.rows.map((row, i) => ({
      rank: i + 1,
      playerName: row.player_name,
      score: row.score,
      createdAt: row.created_at,
    }));

    res.json({ gameId, device, scores });
  } catch (err) {
    console.error('GET /scores error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
