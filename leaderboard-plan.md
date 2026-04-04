# JayArcade Global Leaderboard — Implementation Plan

## Overview

A new standalone Node.js service (`leaderboard-server`) deployed on Railway alongside `factory-network-server`. It exposes a REST API for submitting and retrieving global high scores per game, separated by device type. Scores are stored in a Railway Postgres database. TurboWarp-packaged games call the API via `fetch()` using config injected at build time via `JAY_GAME_CONFIG`.

---

## Architecture

```
jayarcade.com (games-directory)
  └── games/{game}/index.html
        └── JAY_GAME_CONFIG (injected at build time)
              ├── leaderboardUrl: "https://leaderboard-server.railway.app"
              ├── gameId: "apple-catcher"
              └── leaderboardKey: "<per-game secret>"
                    │
                    │ fetch() POST /scores
                    │ fetch() GET  /scores/:gameId?device=mobile
                    ▼
Railway Project
  ├── factory-network-server   (existing, WebSocket multiplayer)
  ├── leaderboard-server       (new, REST leaderboard API)
  └── Postgres                 (new, Railway DB plugin)
```

---

## Repo Location

```
C:\Users\leoja\Desktop\Dad Games\full-games\leaderboard-server\
```

Same stack as `factory-network-server`: Node.js + Express.

**File structure:**
```
leaderboard-server/
  server.js
  db.js
  gameConfig.js
  routes/
    scores.js
  middleware/
    auth.js
    rateLimit.js
  package.json
  CLAUDE.md
  leaderboard-plan.md
```

---

## Device Types

Three valid values — no others accepted:

| Value | When used |
|---|---|
| `mobile` | Browser on phone/tablet (touch controls via jay-mobile.js) |
| `desktop` | Browser on desktop/laptop (keyboard controls) |
| `arcade` | Physical arcade cabinet (Raspberry Pi, dedicated controls) |

Leaderboards are fully separated by device type. Mobile scores never appear on desktop boards and vice versa. Arcade cabinets get their own board even though they run on Raspberry Pi — the control scheme is what matters, not the hardware.

---

## Database Schema

Single table in Railway Postgres:

```sql
CREATE TABLE scores (
  id          SERIAL PRIMARY KEY,
  game_id     TEXT        NOT NULL,
  player_name TEXT        NOT NULL,
  score       INTEGER     NOT NULL,
  device_type TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_game_id            ON scores (game_id);
CREATE INDEX idx_scores_game_device        ON scores (game_id, device_type);
CREATE INDEX idx_scores_game_device_score  ON scores (game_id, device_type, score DESC);
```

---

## API

### POST /scores
Submit a score.

**Headers:**
```
Content-Type: application/json
x-leaderboard-key: <per-game secret>
```

**Body:**
```json
{
  "gameId":     "apple-catcher",
  "playerName": "Jay",
  "score":      1450,
  "deviceType": "mobile"
}
```

**Validation:**
- `x-leaderboard-key` must match the key registered for `gameId`
- `score` must be an integer within the configured valid range for `gameId`
- `playerName` max 32 characters, stripped of HTML
- `deviceType` must be `"mobile"`, `"desktop"`, or `"arcade"` — anything else is `400`
- Rate limited: max 10 submissions per IP per minute

**Response 201:**
```json
{ "ok": true, "id": 42 }
```

---

### GET /scores/:gameId
Fetch the global top scores for a game and device type.

**Query params:**
- `device` — **required.** Must be `mobile`, `desktop`, or `arcade`. Returns `400` if omitted or invalid.
- `limit` — number of scores to return (default: 10, max: 100)

**Example:** `GET /scores/apple-catcher?device=mobile&limit=10`

**Response 200:**
```json
{
  "gameId": "apple-catcher",
  "device": "mobile",
  "scores": [
    { "rank": 1, "playerName": "Jay",  "score": 1450, "createdAt": "2026-04-04T12:00:00Z" },
    { "rank": 2, "playerName": "Alex", "score": 1200, "createdAt": "2026-04-03T09:30:00Z" }
  ]
}
```

No auth required — leaderboards are public reads.

---

### GET /health
```json
{ "ok": true, "service": "leaderboard-server" }
```

---

## Security & Anti-Cheat

### Per-game secret keys
- Each game has a unique key stored as a Railway environment variable (e.g. `KEY_APPLE_CATCHER`)
- The server loads a `gameId → key` map from env at startup
- The key is injected into `JAY_GAME_CONFIG` at build time by `patch_all_games.py`
- Requests with a missing or wrong key are rejected with `401`

### Score range validation
- `gameConfig.js` holds a `gameId → { min, max }` map of valid score ranges
- Scores outside the range for their game are rejected with `400`
- Ranges set per-game based on what is actually achievable

### Rate limiting
- Max 10 `POST /scores` per IP per minute (in-memory sliding window)
- Returns `429` when exceeded

### CORS
- `GET /scores/:gameId` — open (public reads)
- `POST /scores` — restricted to `jayarcade.com` origin

---

## Build Pipeline Integration (games-directory)

### `game.json` — add leaderboard fields per game:
```json
{
  "order": 1,
  "title": "Apple Catcher",
  "leaderboard": {
    "enabled": true,
    "scoreMin": 0,
    "scoreMax": 9999
  }
}
```

### `patch_all_games.py` — extend `JAY_GAME_CONFIG` injection:
```js
const JAY_GAME_CONFIG = {
  // existing fields...
  leaderboard: {
    url:    "https://leaderboard-server.railway.app",
    gameId: "apple-catcher",
    key:    "<injected-at-build-time>"
  }
};
```

`deviceType` is not hardcoded in `JAY_GAME_CONFIG` — it is detected at runtime by `jay-mobile.js` and passed into the submission call.

### `JayLeaderboard` JS helper
Injected as an inline `<script>` block by the patcher. Thin `fetch()` wrapper:

```js
// Submit a score (deviceType detected at runtime)
JayLeaderboard.submit(playerName, score);

// Fetch top N scores for current device type
JayLeaderboard.getTop(10).then(scores => { /* render */ });

// Fetch top N scores for a specific device type (for master leaderboard page)
JayLeaderboard.getTop(10, "desktop").then(scores => { /* render */ });
```

Keys are stored as environment variables on the build machine — never committed to the repo.

---

## Railway Setup Steps

1. Add new service `leaderboard-server` to the existing Railway project
2. Add Railway Postgres plugin to the project (`DATABASE_URL` is auto-injected)
3. Run the schema SQL once via Railway's Postgres console
4. Add env vars for each game's secret key: `KEY_APPLE_CATCHER`, `KEY_ART_OF_WAR`, etc.
5. Set score ranges in `gameConfig.js` (committed to repo, no secrets)

---

## Out of Scope (for now)

- Personal bests (stored locally in-game)
- Daily / weekly leaderboard filters
- JayArcade OS subscription gating
- Authenticated player accounts
- Score verification beyond key + range validation
- Master leaderboard page on jayarcade.com (all games, all devices, with world record video submissions per game)
