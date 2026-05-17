import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ProofBadge, VerifyGate } from '@neus/sdk/widgets';

const DEMO_VERIFIERS = ['nft-ownership'];

function withEnvUrl(v, kind) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (kind === 'origin' && typeof window !== 'undefined') return window.location.origin;
  if (kind === 'checkout' && typeof window !== 'undefined') {
    return new URL('mock-checkout.html', window.location.origin).href;
  }
  if (kind === 'api' && typeof window !== 'undefined') return window.location.origin;
  return 'https://api.neus.network';
}

function readQHashFromQuery() {
  if (typeof window === 'undefined') return '';
  const id = new URLSearchParams(window.location.search).get('qHash');
  return typeof id === 'string' && id.startsWith('0x') ? id : '';
}

function stripQHashFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('qHash')) return;
  url.searchParams.delete('qHash');
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const appId = import.meta.env.VITE_NEUS_APP_ID || 'sdk-dev-chat-demo';
  const apiUrl = withEnvUrl(import.meta.env.VITE_NEUS_API_URL, 'api');
  const hostedCheckoutUrl = withEnvUrl(import.meta.env.VITE_NEUS_HOSTED_CHECKOUT_URL, 'checkout');
  const isLiveApi = Boolean(
    typeof import.meta.env.VITE_NEUS_API_URL === 'string' && import.meta.env.VITE_NEUS_API_URL.trim()
  );

  const [messages, setMessages] = useState(() => [
    { id: 'm0', role: 'assistant', text: 'Welcome. Verify once to unlock this chat.' }
  ]);
  const [draft, setDraft] = useState('');
  const [qHashInput, setQHashInput] = useState('');
  const [qHash, setQHash] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fromUrl = readQHashFromQuery();
    if (!fromUrl) return;
    setQHash(fromUrl);
    setQHashInput(fromUrl);
    setIsVerified(true);
    stripQHashFromUrl();
  }, []);

  const badgeApiUrl = useMemo(() => apiUrl, [apiUrl]);

  const onVerified = useCallback((payload) => {
    const id = typeof payload === 'string' ? payload : payload?.qHash;
    if (!id) return;
    setQHash(id);
    setQHashInput(id);
    setIsVerified(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        text: 'Verified. Your trust receipt is active.'
      }
    ]);
  }, []);

  const send = (e) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: t },
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: 'Echo: ' + t
      }
    ]);
  };

  return (
    <div className="demo-root">
      <header className="demo-header">
        <div>
          <h1>Trust-gated chat</h1>
          <p>Verify once to unlock messaging. Your proof stays reusable.</p>
        </div>
        <span className={'env-pill' + (isLiveApi ? ' env-pill--live' : '')}>
          {isLiveApi ? 'Live' : 'Demo'}
        </span>
      </header>

      <div className="layout">
        <section className="chat-panel" aria-label="Chat">
          <div className="messages">
            {messages.map((m) => (
              <div key={m.id} className={'msg msg--' + (m.role === 'user' ? 'user' : 'assistant')}>
                {m.text}
              </div>
            ))}
          </div>

          {!isVerified && (
            <div className="chat-glass-overlay">
              <div className="chat-glass-content">
                <div className="chat-glass-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2>This conversation is gated</h2>
                <p>Verify your wallet to start messaging.</p>
                <VerifyGate
                  appId={appId}
                  apiUrl={apiUrl}
                  hostedCheckoutUrl={hostedCheckoutUrl}
                  requiredVerifiers={DEMO_VERIFIERS}
                  verifierData={{
                    'nft-ownership': {
                      contractAddress: '0x0000000000000000000000000000000000000001',
                      tokenId: '1',
                      chainId: 1
                    }
                  }}
                  onVerified={onVerified}
                />
              </div>
            </div>
          )}

          {isVerified && (
            <div className="composer">
              <form className="composer-row" onSubmit={send}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  autoComplete="off"
                  aria-label="Message"
                />
                <button type="submit" disabled={!draft.trim()}>
                  Send
                </button>
              </form>
            </div>
          )}
        </section>

        <aside className="side-panel" aria-label="Proof">
          <h2>Proof</h2>
          <p>Paste a proof hash, or verify to populate it.</p>
          <div className="qhash-field">
            <label htmlFor="qhash">Proof hash</label>
            <input
              id="qhash"
              value={qHashInput}
              onChange={(e) => setQHashInput(e.target.value)}
              onBlur={() => setQHash(qHashInput.trim())}
              placeholder="0x…"
              spellCheck={false}
            />
          </div>
          <div className="badge-wrap">
            {qHash ? (
              <ProofBadge qHash={qHash} apiUrl={badgeApiUrl} showChains showLabel />
            ) : (
              <span className="badge-placeholder">Waiting for proof</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
