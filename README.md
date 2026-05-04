# squirrel-wallet-site

Marketing & legal site for [Squirrel Wallet](https://squirrelwallet.app/).

Hosted on GitHub Pages, served at the custom domain `squirrelwallet.app` via Cloudflare DNS + free SSL.

## Pages

| URL | File | Purpose |
|-----|------|---------|
| `/` | `index.html` | Landing — App intro, feature highlights, links to legal & support |
| `/privacy/` | `privacy/index.html` | Privacy Policy (中文 + English) — required by App Store Review |
| `/support/` | `support/index.html` | Support page (FAQ + contact email) |

## Stack

- Plain HTML + a single `styles.css`. No build step, no Jekyll, no JS framework.
- The simpler this stays, the less it can break right before an App Store review.

## Editing

1. Edit the `.html` / `.css` directly.
2. Push to `main`. GitHub Pages re-deploys within ~1 minute.
3. Cloudflare in front handles cache busting + global CDN automatically.

## Custom domain wiring

DNS is on Cloudflare Registrar:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `ftll574.github.io` |

GitHub repo Settings → Pages → Custom domain: `squirrelwallet.app` + Enforce HTTPS.

## Email

`support@squirrelwallet.app` is set up via Cloudflare Email Routing (free) and forwards to the maintainer's personal inbox. To change the destination, update the route in Cloudflare dashboard → Email → Routing rules.

## License

Site content is © 2026 Squirrel Wallet, all rights reserved. The App itself has its own repository and licensing.
