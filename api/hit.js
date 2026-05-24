// Utah Billboards reader-ping endpoint.
// Receives a beacon from the article, forwards a per-visit email via Resend.
//
// Required env vars (set in Vercel project settings):
//   RESEND_API_KEY       Resend API key (resend.com)
//   ALERT_TO_EMAIL       Where to send the alert (e.g. d999ss@gmail.com)
//   ALERT_FROM_EMAIL     Verified sender (default: alerts@resend.dev sandbox)
//
// Optional:
//   OWNER_IPS            Comma-separated IPs to skip (your own visits)
//   ALERTS_DISABLED      Set to "true" to mute without redeploying

export const config = { runtime: 'edge' };

const BOT_RE = /bot|crawler|spider|preview|whatsapp|facebookexternal|slackbot|twitterbot|googlebot|bingbot|yandex|baiduspider|duckduck|linkedinbot|applebot|petalbot|ahrefs|semrush|mj12bot|headlesschrome/i;

export default async function handler(req) {
  // Always 204 the client — never block or surface errors to readers.
  const ok = new Response(null, { status: 204 });

  if (req.method !== 'POST' && req.method !== 'GET') return ok;
  if (process.env.ALERTS_DISABLED === 'true') return ok;

  const ua = req.headers.get('user-agent') || '';
  if (BOT_RE.test(ua)) return ok;

  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '';

  const ownerIps = (process.env.OWNER_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ownerIps.includes(ip)) return ok;

  const country = req.headers.get('x-vercel-ip-country') || '';
  const region = req.headers.get('x-vercel-ip-country-region') || '';
  const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') || '');
  const referer = req.headers.get('referer') || '(direct)';

  let path = '/';
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      path = body?.p || '/';
    } else {
      path = new URL(req.url).searchParams.get('p') || '/';
    }
  } catch (_) {}

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_TO_EMAIL || 'hawk@makebttr.com';
  if (!apiKey || !to) return ok;

  const from = process.env.ALERT_FROM_EMAIL || 'Utah Billboards <onboarding@resend.dev>';
  const where = [city, region, country].filter(Boolean).join(', ') || 'unknown';
  // Canonical DS.OS visit grammar — `{Site} visit · {path} · {city}` subject +
  // Page/Location/Referrer/Time/IP/Browser body — parsed by visits-sync-resend.
  const subject = `Utah Billboards visit · ${path} · ${city || where}`;
  const text = [
    `Page ${path}`,
    `Location ${where}`,
    `Referrer ${referer}`,
    `Time ${new Date().toISOString()}`,
    `IP ${ip || 'unknown'}`,
    `Browser ${ua}`,
  ].join('\n');

  // Fire and forget — do not let an email error block the beacon.
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
  } catch (_) {}

  return ok;
}
