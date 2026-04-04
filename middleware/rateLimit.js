// In-memory sliding window rate limiter: 10 POST /scores per IP per minute.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

const ipWindows = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const timestamps = (ipWindows.get(ip) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  timestamps.push(now);
  ipWindows.set(ip, timestamps);
  next();
}

module.exports = { rateLimit };
