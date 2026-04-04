const express = require('express');
const cors = require('cors');
const scoresRouter = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — GET is open, POST restricted to jayarcade.com
app.use('/scores', (req, res, next) => {
  if (req.method === 'GET') {
    cors()(req, res, next);
  } else {
    cors({ origin: 'https://jayarcade.com' })(req, res, next);
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'leaderboard-server' });
});

app.use('/scores', scoresRouter);

app.listen(PORT, () => {
  console.log(`leaderboard-server listening on port ${PORT}`);
});
