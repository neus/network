# React Component Example

Minimal VerifyGate integration.

## Install

```bash
npm install @neus/sdk
```

## Usage

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export default function Page() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1
        }
      }}
    >
      <div>
        <h2>Exclusive Content</h2>
        <p>Only visible to NFT holders.</p>
      </div>
    </VerifyGate>
  );
}
```

## Other Verifiers

**Token holding:**

```jsx
<VerifyGate
  requiredVerifiers={['token-holding']}
  verifierData={{
    'token-holding': {
      contractAddress: '0x...',
      minBalance: '100.0',
      chainId: 1
    }
  }}
>
  <DAOContent />
</VerifyGate>
```

**Content ownership:**

```jsx
<VerifyGate requiredVerifiers={['ownership-basic']}>
  <CreatorContent />
</VerifyGate>
```

---

## Advanced: Next.js Proxy

For Next.js apps, you can optionally use a proxy route.

**Create `/app/api/neus/[...path]/route.js`:**

```javascript
const BASE = 'https://api.neus.network';

export async function GET(req, { params }) {
  const url = new URL(req.url);
  const upstream = `${BASE}/${params.path.join('/')}?${url.searchParams.toString()}`;
  const res = await fetch(upstream, {
    method: 'GET',
    headers: { Accept: req.headers.get('accept') || 'application/json' }
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' }
  });
}

export async function POST(req, { params }) {
  const res = await fetch(`${BASE}/${params.path.join('/')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text()
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' }
  });
}
```

**Use the proxy:**

```jsx
<VerifyGate
  apiUrl="/api/neus"
  requiredVerifiers={['nft-ownership']}
  verifierData={{ ... }}
>
  <GatedContent />
</VerifyGate>
```

This is optional. The default API URL works directly in most environments.

---

## Next Steps

- [Quickstart](../../docs/QUICKSTART.md) — Create your first proof
- [Verifiers](../../docs/verifiers/README.md) — Verifier catalog and schemas
- [API Reference](../../docs/api/README.md) — HTTP endpoints
