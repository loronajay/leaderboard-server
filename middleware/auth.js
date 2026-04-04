// Loads per-game keys from env at startup and validates x-leaderboard-key on POST /scores.
// Env var format: KEY_APPLE_CATCHER, KEY_ART_OF_WAR, etc.
const keyMap = {
  'apple-catcher':   process.env.KEY_APPLE_CATCHER,
  'art-of-war':      process.env.KEY_ART_OF_WAR,
  'bird-duty':       process.env.KEY_BIRD_DUTY,
  'blade-and-sphere': process.env.KEY_BLADE_AND_SPHERE,
  'dodgeballs':      process.env.KEY_DODGEBALLS,
  'mini-arcade':     process.env.KEY_MINI_ARCADE,
  'paddle-battle':   process.env.KEY_PADDLE_BATTLE,
  'space-molestors': process.env.KEY_SPACE_MOLESTORS,
  'speed-demon':     process.env.KEY_SPEED_DEMON,
  'sumorai':         process.env.KEY_SUMORAI,
};

function validateKey(req, res, next) {
  const { gameId } = req.body;
  const providedKey = req.headers['x-leaderboard-key'];
  const expectedKey = keyMap[gameId];

  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = { validateKey };
