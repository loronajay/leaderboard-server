# leaderboard-server

Global leaderboard REST API powering [jayarcade.com](https://jayarcade.com).
Part of the [Jay Arcade](https://github.com/loronajay/loronajay) ecosystem.

## What it does

- Accepts score submissions from any Jay Arcade game
- Validates scores against per-game min/max ranges defined in `gameConfig.js`
- Separates leaderboards by device type: `mobile`, `desktop`, `arcade`
- Authenticates writes with per-game secret keys (one env var per game)
- Rate limits submissions to prevent spam
- Sanitizes player names (strips HTML, enforces 1–32 character limit)
- Public read access — writes restricted to `jayarcade.com`

## Endpoints

```
GET  /scores/:gameId?device=desktop&limit=10  — fetch top scores for a game
POST /scores                                  — submit a score (requires API key)
GET  /health                                  — service health check
```

**POST body:**
```json
{
  "gameId": "apple-catcher",
  "playerName": "JAY",
  "score": 4200,
  "deviceType": "desktop"
}
```

**GET response:**
```json
{
  "gameId": "apple-catcher",
  "device": "desktop",
  "scores": [
    { "rank": 1, "playerName": "JAY", "score": 4200, "createdAt": "..." }
  ]
}
```

## Stack

Node.js · Express · PostgreSQL · Railway

## Architecture

```
server.js         — entry point, CORS policy, route mounting
routes/scores.js  — POST /scores and GET /scores/:gameId
middleware/auth   — per-game API key validation
middleware/rate   — rate limiting
db.js             — PostgreSQL connection
gameConfig.js     — per-game score range validation (no secrets, safe to commit)
```

CORS policy: GET requests are fully open. POST requests are restricted to `https://jayarcade.com`.
Each game has its own secret key deployed as a Railway environment variable.
Scores outside a game's valid range are rejected before hitting the database.

## Part of a larger system

Scores are submitted via `factory-leaderboards.js`, a TurboWarp extension in the
[TurboWarp Game Factory](https://github.com/loronajay/textify-blockify-IR) that wraps
the full submission + display flow into drag-and-drop Scratch blocks — making leaderboard
integration a backpack operation for any Jay Arcade game.
