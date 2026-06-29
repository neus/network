import { useState } from 'react';
import { NeusClient, getHostedCheckoutUrl } from '@neus/sdk';
import { ProofBadge } from '@neus/sdk/widgets';

const GATE_ID = 'gate_acme-creator';
const NAMESPACE = 'acme';

export default function App() {
  const [handle, setHandle] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const client = new NeusClient({ apiUrl: 'https://api.neus.network' });

      // The SDK builds the signing string, prompts the wallet, and submits.
      const proof = await client.verify({
        verifier: 'ownership-pseudonym',
        wallet: window.ethereum,
        data: {
          pseudonymId: handle,
          namespace: NAMESPACE,
          displayName: handle,
        },
        options: {
          publicDisplay: true,
        },
      });

      setReceipt(proof);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function openHostedVerify() {
    window.location.assign(
      getHostedCheckoutUrl({
        gateId: GATE_ID,
        returnUrl: window.location.href,
      }),
    );
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 520 }}>
      <h1>Claim your ACME handle</h1>
      <p>Bind your handle to your wallet and get a NEUS Proof Receipt.</p>

      <label>
        Handle
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="creatorhandle"
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
        />
      </label>

      <button onClick={claim} disabled={busy || !handle}>
        {busy ? 'Issuing receipt...' : 'Claim with NEUS'}
      </button>
      {' '}
      <button onClick={openHostedVerify}>Use Hosted Verify</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {receipt && (
        <div style={{ marginTop: 24 }}>
          <h2>@{handle}</h2>
          <ProofBadge qHash={receipt.qHash} showChains />
          <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Proof:{' '}
            <a href={receipt.proofUrl} target="_blank" rel="noreferrer">
              {receipt.proofUrl}
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
