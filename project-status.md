# Leaderboard Project Status
**Last updated: 2026-04-11**

---

## What's Done

### leaderboard-server (this repo)
- [x] Full server built: Express + pg, POST /scores, GET /scores/:gameId, GET /health
- [x] Per-game auth middleware (x-leaderboard-key header)
- [x] Rate limiting (10 POST/IP/min, in-memory sliding window)
- [x] Score range validation via gameConfig.js (all set to 99999 for now — update per game later)
- [x] CORS: GET open, POST restricted to jayarcade.com
- [x] Deployed to Railway
- [x] PostgreSQL connected via DATABASE_URL
- [x] DB schema deployed: table `scores`, columns id/game_id/player_name/score/device_type/created_at (TIMESTAMPTZ)
- [x] Indexes deployed: idx_scores_game_id, idx_scores_game_device, idx_scores_game_device_score
- [x] 9 game secret keys deployed as Railway env vars (all except mini-arcade)
- [x] Health check confirmed: https://leaderboard-server-production.up.railway.app/health

### games-directory-page pipeline
- [x] `.env` created at `C:\Users\leoja\Desktop\Dad Games\full-games\.env` with all 9 game keys
- [x] `factory-leaderboards.js` cloud sync blocks implemented (cloudAvailable, submitToCloud, fetchFromCloud, cloudSyncStatus)
- [x] `game.json` leaderboard block added to all 9 games (enabled: true for apple-catcher, bird-duty, blade-and-sphere, space-molestors, speed-demon)
- [x] `patch_all_games.py` extended to load `.env`, inject `leaderboard` config into `JAY_GAME_CONFIG`, and inject `JayLeaderboard` helper inline per game
- [x] Dry run confirmed: 5 games patched with leaderboard, 4 skipped as expected

---

## What's Left (In Order)

### ~~Step 1 — Rebuild apple-catcher in TurboWarp~~ ✓ Done
### ~~Step 2 — Full build, commit, push~~ ✓ Done
### ~~Step 3 — End-to-end test~~ ✓ Done (2026-04-11)
Scores landing confirmed: POST /scores returns 201, GET /scores/apple-catcher returns ranked entries.

---

## Nice-to-Do Later
- Set accurate scoreMax per game in both gameConfig.js (server) and game.json files (pipeline)
- Arcade cabinet device type (defined in spec, not yet in production)
