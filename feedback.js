export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const msg = String(b.msg || '').slice(0, 2000);
  if (msg.length < 5) return res.status(400).json({ ok: false });
  const text = `bechlystudio Feedback\nRolle: ${String(b.role || '').slice(0, 40)}\nE-Mail: ${String(b.email || '').slice(0, 120) || '-'}\n${msg}`;
  if (process.env.FEEDBACK_WEBHOOK_URL) {
    await fetch(process.env.FEEDBACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, content: text }) }).catch(() => {});
  } else console.log(text);
  return res.status(200).json({ ok: true });
}
