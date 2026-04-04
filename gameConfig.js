// Per-game score range validation. No secrets here — safe to commit.
// scoreMin / scoreMax reflect what is actually achievable in each game.
const gameConfig = {
  'apple-catcher':  { min: 0, max: 99999 },
  'art-of-war':     { min: 0, max: 99999 },
  'bird-duty':      { min: 0, max: 99999 },
  'blade-and-sphere': { min: 0, max: 99999 },
  'dodgeballs':     { min: 0, max: 99999 },
  'mini-arcade':    { min: 0, max: 99999 },
  'paddle-battle':  { min: 0, max: 99999 },
  'space-molestors': { min: 0, max: 99999 },
  'speed-demon':    { min: 0, max: 99999 },
  'sumorai':        { min: 0, max: 99999 },
};

module.exports = gameConfig;
