# Deploy & DNS

## Live
- Vercel project: `utah-billboards` (scope: bttr)
- Production URL: https://utah-billboards.vercel.app
- Repo: https://github.com/d999ss/billboards (pushes auto-deploy once Git is connected in Vercel dashboard)

## Stack (reused from insanitywolf)
- Static HTML, no build (`vercel.json`: outputDirectory `.`, cleanUrls, trailingSlash, security headers)
- `/api/hit` — edge function, per-visit Resend email beacon (DS.OS visit grammar)
- Vercel Web Analytics (zero-config second source)
- robots.txt · sitemap.xml · site.webmanifest · favicon.svg

## Remaining manual step — Squarespace DNS

`utah-billboards.com` is registered at Squarespace (Google-Domains-migrated, `ns-cloud-*` nameservers). In **Squarespace → Domains → utah-billboards.com → DNS Settings → Custom Records**, add:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Remove any conflicting default A/CNAME on `@` / `www` first. Propagation 10 min–2 h; Vercel auto-issues the SSL cert and emails on completion. Both domains are already attached to the Vercel project.

## Remaining config — tracker email (optional)
The `/api/hit` beacon returns 204 and silently no-ops until these env vars are set on the Vercel project (Settings → Environment Variables), then redeploy:

| Var | Value |
|-----|-------|
| `RESEND_API_KEY` | Resend key (Flight Deck workspace — has a verified sender domain) |
| `ALERT_TO_EMAIL` | `d999ss@gmail.com` |
| `ALERT_FROM_EMAIL` | a verified-domain sender, or leave default `onboarding@resend.dev` sandbox |
| `OWNER_IPS` | your IP(s) to exclude self-visits (optional) |

Until set, Vercel Web Analytics still captures traffic.
