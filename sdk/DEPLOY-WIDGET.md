# Deploy Verify Widget to Cloudflare Pages

## One-command deploy (from `sdk/` directory)

```bash
cd sdk
npm run deploy:widget
```

This builds `widget.js` and deploys to the `neus-verify-widget` Cloudflare Pages project.

## Prerequisites

1. **Wrangler auth**: Run `npx wrangler login` once (opens browser to authenticate).
2. **Project exists**: The first deploy creates the project if it doesn't exist.

## Custom domain (one-time setup)

1. Cloudflare Dashboard → Pages → `neus-verify-widget` → Custom domains.
2. Add `verify.neus.network`.
3. Cloudflare DNS: Add CNAME `verify` → `neus-verify-widget.pages.dev` (or use the suggested record).

## Verify

After deploy, test:

- `https://verify.neus.network/widget.js` (or `https://neus-verify-widget.pages.dev/widget.js` before custom domain)
- Embed on any page: `<script src="https://verify.neus.network/widget.js"></script>` + `<div data-neus-proof="YOUR_QHASH"></div>`
