const CATALOG = {
  'ownership-basic': { supportsDirectApi: true },
  'ownership-pseudonym': { supportsDirectApi: true },
  'ownership-dns-txt': { supportsDirectApi: true },
  'ownership-social': { supportsDirectApi: false },
  'ownership-org-oauth': { supportsDirectApi: false },
  'contract-ownership': { supportsDirectApi: true },
  'nft-ownership': { supportsDirectApi: true },
  'token-holding': { supportsDirectApi: true },
  'wallet-link': { supportsDirectApi: true },
  'wallet-risk': { supportsDirectApi: true },
  'proof-of-human': { supportsDirectApi: false },
  'agent-identity': { supportsDirectApi: true },
  'agent-delegation': { supportsDirectApi: true },
  'ai-content-moderation': { supportsDirectApi: true }
};

const verifierList = Object.keys(CATALOG);

export function createNeusMockCore(options = {}) {
  const newProofId =
    options.newProofId ||
    (() => {
      const b = new Uint8Array(32);
      globalThis.crypto.getRandomValues(b);
      return `0x${Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')}`;
    });

  const proofs = new Map();

  function handle(method, pathname, _search, bodyText) {
    if (method === 'GET' && pathname === '/api/v1/health') {
      return { status: 200, json: { success: true, data: { status: 'ok' } } };
    }

    if (method === 'GET' && pathname === '/api/v1/verification/verifiers') {
      return {
        status: 200,
        json: { success: true, data: verifierList, metadata: CATALOG }
      };
    }

    if (method === 'GET' && pathname.startsWith('/api/v1/proofs/by-wallet/')) {
      return {
        status: 200,
        json: { success: true, data: { proofs: [], totalCount: 0, hasMore: false } }
      };
    }

    if (method === 'GET' && pathname.startsWith('/api/v1/proofs/check')) {
      return {
        status: 200,
        json: { success: true, data: { eligible: false, matchedQHashes: [] } }
      };
    }

    const proofGet = method === 'GET' && pathname.match(/^\/api\/v1\/proofs\/(0x[a-fA-F0-9]{64})$/);
    if (proofGet) {
      const id = proofGet[1].toLowerCase();
      const rec = proofs.get(id);
      if (!rec) {
        return { status: 404, json: { success: false, error: { message: 'Proof not found' } } };
      }
      const verifiedVerifiers = rec.verifierIds.map((verifierId) => ({ verifierId, verified: true }));
      return {
        status: 200,
        json: {
          success: true,
          data: {
            status: 'verified',
            proofId: id,
            qHash: id,
            walletAddress: rec.walletAddress,
            verifiedVerifiers
          }
        }
      };
    }

    if (method === 'POST' && pathname === '/api/v1/verification') {
      let parsed;
      try {
        parsed = JSON.parse(bodyText || '{}');
      } catch {
        return { status: 400, json: { success: false, error: { message: 'Invalid JSON' } } };
      }
      const ids = Array.isArray(parsed.verifierIds) ? parsed.verifierIds : [];
      if (!ids.length) {
        return { status: 400, json: { success: false, error: { message: 'verifierIds required' } } };
      }
      const id = newProofId().toLowerCase();
      proofs.set(id, { verifierIds: ids, walletAddress: String(parsed.walletAddress || '') });
      return {
        status: 200,
        json: {
          success: true,
          data: {
            proofId: id,
            qHash: id,
            status: 'verifying',
            resource: { proofId: id, qHash: id, status: 'verifying' }
          }
        }
      };
    }

    return null;
  }

  return { handle, proofs };
}
