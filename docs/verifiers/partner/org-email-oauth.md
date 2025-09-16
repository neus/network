# Org Email

What it proves
- Control of an organization email at a specific domain via OAuth (Google/Microsoft). Links the verified email domain to a wallet.

Inputs
- provider: 'google' | 'microsoft' (github/discord supported patterns but focus on org email)
- oauthCode: authorization code
- walletAddress: address to link
- expectedOrgDomain?: string (enforce domain match)
- state?: string (recommended)
- redirectUri?: string (input is normalized/enforced against configured redirectUri)

Verification
- Exchanges code for token with provider, fetches user profile/email, extracts email, checks domain match if provided, validates state if configured, stores wallet ↔ email domain linkage.

Outputs
- qHash proof with { email, orgDomain, walletAddress, provider, verifiedAt }.

Privacy
- Email is handled; consider private proofs. Do not expose provider tokens. Domain match may be enforced.

High‑value use cases
- Enterprise workspace access and admin elevation
- B2B partner whitelisting by domain
- Staff‑only tooling with wallet‑anchored sessions

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
