import { Redis } from '@upstash/redis';

// Pflicht: UPSTASH_REDIS_REST_URL/_TOKEN (Tageslimit). Ohne Redis bleibt die KI aus Kostengruenden gesperrt.
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const codes = (process.env.INVITE_CODES || '').split(',').map(s => s.trim()).filter(Boolean);
const isImg = s => typeof s === 'string' && /^data:image\/(png|jpeg);base64,/.test(s) && s.length < 2_000_000;
const NEG = 'distorted geometry, extra windows, changed proportions, text, watermark, people, cartoon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (process.env.AI_KILL_SWITCH === '1') return res.status(503).json({ error: 'paused' });
  if (!redis) return res.status(503).json({ error: 'limiter missing' });

  const { beauty, depth, prompt, fidelity = 0.75, variants = 2, code = '' } = req.body || {};
  if (codes.length && !codes.includes(String(code).trim())) return res.status(403).json({ error: 'code' });
  if (!isImg(beauty) || !isImg(depth) || typeof prompt !== 'string' || prompt.length > 1500)
    return res.status(400).json({ error: 'input' });

  const who = codes.length ? 'c:' + String(code).trim() : 'ip:' + ((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown');
  const key = `rl:${who}:${new Date().toISOString().slice(0, 10)}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 86400);
  if (n > Number(process.env.DAILY_LIMIT || 3)) return res.status(429).json({ error: 'limit' });

  try {
    const job = await startJob({ beauty, depth, prompt, strength: 1 - Math.min(0.95, Math.max(0.4, Number(fidelity) || 0.75)), n: Math.min(Math.max(Number(variants) || 1, 1), 4) });
    return res.status(202).json({ jobId: job.id });
  } catch (e) {
    console.error('render', e);
    return res.status(502).json({ error: 'provider' });
  }
}

// ADAPTER: hier (und in status.js) wird der gewaehlte Bildanbieter angebunden.
// Erwarteter Vertrag: POST IMAGE_API_URL -> { id }. An die API des Anbieters anpassen.
async function startJob({ beauty, depth, prompt, strength, n }) {
  if (!process.env.IMAGE_API_URL) throw new Error('IMAGE_API_URL fehlt');
  const r = await fetch(process.env.IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.IMAGE_API_KEY}` },
    body: JSON.stringify({ image: beauty, control_image: depth, prompt, negative_prompt: NEG, strength, num_outputs: n })
  });
  if (!r.ok) throw new Error('provider ' + r.status);
  return r.json();
}
