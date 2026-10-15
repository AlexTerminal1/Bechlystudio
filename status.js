// ADAPTER: Status beim Anbieter abfragen und auf { status: 'pending'|'done'|'failed', images: [https-URLs] } abbilden.
export default async function handler(req, res) {
  const id = String(req.query.id || '').slice(0, 120);
  if (!id || !process.env.IMAGE_STATUS_URL) return res.status(400).json({ status: 'failed' });
  try {
    const r = await fetch(`${process.env.IMAGE_STATUS_URL}?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.IMAGE_API_KEY}` }
    });
    if (!r.ok) return res.status(200).json({ status: 'failed' });
    const j = await r.json();
    const st = j.status === 'succeeded' || j.status === 'done' ? 'done' : j.status === 'failed' ? 'failed' : 'pending';
    const images = st === 'done' ? [].concat(j.images || j.output || []).filter(u => typeof u === 'string' && u.startsWith('https://')) : [];
    return res.status(200).json({ status: st, images });
  } catch (e) {
    console.error('status', e);
    return res.status(200).json({ status: 'failed' });
  }
}
