# Leaderboard Project Status
**Last updated: 2026-04-04**

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

---

## What's Left (In Order)

### Step 1 — Set up local .env file
Create a `.env` file at:
```
C:\Users\leoja\Desktop\Dad Games\full-games\.env
```
(One level above the repos — never inside a repo, never committed.)

Contents:
```
LEADERBOARD_URL=https://leaderboard-server-production.up.railway.app
KEY_APPLE_CATCHER=<your secret>
KEY_ART_OF_WAR=<your secret>
KEY_BIRD_DUTY=<your secret>
KEY_BLADE_AND_SPHERE=<your secret>
KEY_DODGEBALLS=<your secret>
KEY_PADDLE_BATTLE=<your secret>
KEY_SPACE_MOLESTORS=<your secret>
KEY_SPEED_DEMON=<your secret>
KEY_SUMORAI=<your secret>
```
These must match the keys already deployed on Railway. Pull them from wherever you stored them.

---

### Step 2 — Update factory-leaderboards.js (TurboWarp extension)
Location: `turbowarp-extensions-js/canon/factory_extensions/factory-leaderboards.js`

Add 4 new cloud sync blocks (do NOT change any existing blocks):
- `cloud leaderboard available ?` — boolean, returns true if window.JayLeaderboard exists
- `submit to cloud player [PLAYER] score [VALUE]` — async command, calls JayLeaderboard.submit()
- `fetch top [LIMIT] scores from cloud into leaderboard [NAME]` — async command, calls JayLeaderboard.getTop()
- `cloud sync status` — reporter, returns "idle" / "loading" / "success" / "error"

Full spec: `leaderboard-server/other/leaderboard-cloud-sync-plan.md`

After updating the extension, each game that uses it must be **rebuilt and re-exported from TurboWarp**.

---

### Step 3 — Update game.json files (games-directory repo)
Add leaderboard fields to each applicable game's game.json:
```json
"leaderboard": {
  "enabled": true,
  "scoreMin": 0,
  "scoreMax": 99999
}
```

Games that need this (9 total — mini-arcade is the lobby, skip it):
- apple-catcher
- art-of-war
- bird-duty
- blade-and-sphere
- dodgeballs
- paddle-battle
- space-molestors
- speed-demon
- sumorai

Set scoreMin/scoreMax to match what's actually achievable in each game. For now 99999 is fine.

---

### Step 4 — Extend patch_all_games.py (games-directory repo)
Three additions to the build pipeline:

**4a.** Load the `.env` file from one level above the repo root at startup.

**4b.** Read each game's `game.json` in `patch_html()` to get the leaderboard block.

**4c.** When `leaderboard.enabled` is true, extend the injected `JAY_GAME_CONFIG` block:
```js
leaderboard: {
  url:    "https://leaderboard-server-production.up.railway.app",
  gameId: "apple-catcher",
  key:    "<loaded from env>"
}
```

**4d.** Inject the `JayLeaderboard` helper script inline after the config block.

Full spec: `leaderboard-server/other/leaderboard-integration-plan.md` (Steps 1–4)
and: `leaderboard-server/other/leaderboard-pipeline-plan.md`

---

### Step 5 — Dry run + verify
```
python scripts/patch_all_games.py --dry-run
```
Check output HTML of one leaderboard-enabled game and one non-enabled game.

---

### Step 6 — Full build, commit, push
```
python scripts/build_arcade.py --commit --push
```

---

### Step 7 — End-to-end test
Pick one game (apple-catcher is a good first target). Confirm:
- Score submission reaches the server (POST /scores returns 201)
- Leaderboard fetches and displays correctly in-game (GET /scores/:gameId)
- Mobile and desktop boards are separate

---

## Nice-to-Do Later
- Set accurate scoreMax per game in both gameConfig.js (server) and game.json files (pipeline)
- Confirm score ranges match what Railway has deployed
- Arcade cabinet device type (defined in spec, not in production yet)
