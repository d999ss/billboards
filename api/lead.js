// Utah Billboards — lead capture endpoint.
// Receives a funnel submission, emails it via Resend to the owner.
//
// Reuses the project env vars already set for /api/hit:
//   RESEND_API_KEY    Resend API key
//   ALERT_FROM_EMAIL  verified sender (e.g. "Utah Billboards <visits@donnysmith.com>")
// Lead-specific (optional, falls back to ALERT_TO_EMAIL then a constant):
//   LEAD_TO_EMAIL     where leads are sent (default: ALERT_TO_EMAIL or donny@makebttr.com)

export const config = { runtime: 'edge' };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const esc = (s) =>
  String(s == null ? '' : s)
    .slice(0, 4000)
    .replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

export default async function handler(req) {
  if (req.method !== 'POST') return json({ ok: false }, 405);

  let body = {};
  try {
    body = await req.json();
  } catch (_) {
    return json({ ok: false, error: 'bad request' }, 400);
  }

  // Honeypot — bots fill hidden fields. Pretend success, drop it.
  if (body.website) return json({ ok: true });

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const role = (body.role || '').toString().trim();
  const message = (body.message || '').toString().trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'A valid email is required.' }, 422);
  }

  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '';
  const country = req.headers.get('x-vercel-ip-country') || '';
  const region = req.headers.get('x-vercel-ip-country-region') || '';
  const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') || '');
  const where = [city, region, country].filter(Boolean).join(', ') || 'unknown';
  const referer = req.headers.get('referer') || '(direct)';

  const apiKey = process.env.RESEND_API_KEY;
  const to =
    process.env.LEAD_TO_EMAIL || process.env.ALERT_TO_EMAIL || 'donny@makebttr.com';
  const from =
    process.env.ALERT_FROM_EMAIL || 'Utah Billboards <onboarding@resend.dev>';

  if (!apiKey) return json({ ok: false, error: 'mail not configured' }, 500);

  const subject = `Lead · ${role || 'inquiry'} · ${name || email}`;
  const text = [
    `Role        ${role || '(not specified)'}`,
    `Name        ${name || '(none)'}`,
    `Email       ${email}`,
    `Phone       ${phone || '(none)'}`,
    `Message     ${message || '(none)'}`,
    `Location    ${where}`,
    `Referrer    ${referer}`,
    `Time        ${new Date().toISOString()}`,
    `IP          ${ip || 'unknown'}`,
  ].join('\n');
  const html = `<h2 style="font:600 16px system-ui;margin:0 0 12px">New Utah Billboards lead</h2>
<table style="font:14px system-ui;border-collapse:collapse">
<tr><td style="padding:4px 14px 4px 0;color:#666">Role</td><td><b>${esc(role) || '—'}</b></td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">Name</td><td>${esc(name) || '—'}</td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">Phone</td><td>${esc(phone) || '—'}</td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666;vertical-align:top">Message</td><td>${esc(message).replace(/\n/g, '<br>') || '—'}</td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">Location</td><td>${esc(where)}</td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">Referrer</td><td>${esc(referer)}</td></tr>
<tr><td style="padding:4px 14px 4px 0;color:#666">IP</td><td>${esc(ip)}</td></tr>
</table>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return json({ ok: false, error: 'send failed', detail: detail.slice(0, 200) }, 502);
    }
  } catch (e) {
    return json({ ok: false, error: 'send error' }, 502);
  }

  return json({ ok: true });
}
