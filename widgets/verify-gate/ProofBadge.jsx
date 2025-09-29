'use client';
/**
 * NEUS ProofBadge Widget
 * Simple status display: verified/failed
 * @license Apache-2.0
 */
import { useEffect, useState } from 'react';

export function ProofBadge({
  qHash,
  size = 'sm',
  uiLinkBase = 'https://neus.network',
  showDot = true,
  labelOverride,
  proof,
  apiUrl
}) {
  const [status, setStatus] = useState(() => {
    if (proof) {
      const raw = String(proof?.status || '').toLowerCase();
      return raw.includes('verified') ? 'verified' : 'failed';
    }
    return 'verified';
  });

  useEffect(() => {
    // Skip fetch if qHash missing or proof object provided
    if (!qHash || proof) return;

    let cancelled = false;

    async function checkStatus() {
      try {
        const base = apiUrl ? String(apiUrl).replace(/\/$/, '') : 'https://api.neus.network';
        const res = await fetch(`${base}/api/v1/verification/status/${qHash}`, {
          headers: { Accept: 'application/json' }
        });

        if (cancelled) return;

        if (res.status === 401 || res.status === 403) {
          setStatus('verified');
          return;
        }

        const json = await res.json().catch(() => ({}));
        const dataStatus = String(json?.data?.status || json?.status || '').toLowerCase();

        // Only treat as verified when status explicitly indicates any verified class
        const verified = dataStatus.includes('verified') || dataStatus.includes('partially_verified') || dataStatus.includes('verified_propagation_failed');

        setStatus(verified ? 'verified' : 'failed');

      } catch (_) {
        if (!cancelled) setStatus('failed');
      }
    }

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [qHash, proof]);

  const href = `${String(uiLinkBase).replace(/\/$/, '')}/proof/${qHash}`;
  const isSm = size === 'sm';
  const height = isSm ? 24 : 28;
  const padding = isSm ? '4px 8px' : '6px 10px';
  const fs = isSm ? 12 : 13;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    padding: showDot ? `0 ${isSm ? 10 : 12}px` : padding,
    height: showDot ? height : 'auto',
    borderRadius: 9999,
    border: '1px solid rgba(148,163,184,0.24)',
    background: 'rgba(2,6,23,0.65)',
    color: '#E5E7EB',
    fontWeight: showDot ? 600 : 700,
    fontSize: fs,
    whiteSpace: 'nowrap',
    lineHeight: 1
  };

  const dotColor = status === 'verified' ? '#10b981' : '#ef4444';
  const dotSize = isSm ? 6 : 8;
  const label = labelOverride || (status === 'verified' ? 'Verified' : 'View Proof');
  const logoSize = isSm ? 14 : 16;
  const BRAND_CID = 'bafkreiefbrffecrifnzcn3hfksklw3vospkf244c5ijkizxtzbsm2vtnga';
  const gateways = ['https://ipfs.neus.network/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'];
  const [g, setG] = useState(0);

  return (
    <a href={href} target="_blank" rel="noreferrer" style={style} aria-label={label} title={label}>
      <img
        src={`${gateways[g]}${BRAND_CID}`}
        alt="NEUS"
        width={logoSize}
        height={logoSize}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setG((i) => (i + 1) % gateways.length)}
        style={{ display: 'inline-block', width: logoSize, height: logoSize, borderRadius: 4 }}
      />
      <span>{label}</span>
      {showDot && (
        <span aria-hidden style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: dotColor, marginLeft: 4 }} />
      )}
    </a>
  );
}

export function NeusPillLink({
  qHash,
  uiLinkBase = 'https://neus.network',
  label = 'View NEUS',
  size = 'sm'
}) {
  const base = String(uiLinkBase).replace(/\/$/, '');
  const href = qHash ? `${base}/proof/${qHash}` : base;

  const isSm = size === 'sm';
  const height = isSm ? 24 : 28;
  const padX = isSm ? 10 : 12;
  const fs = isSm ? 12 : 13;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    padding: `0 ${padX}px`,
    height,
    borderRadius: 9999,
    border: '1px solid rgba(148,163,184,0.24)',
    background: 'rgba(2,6,23,0.65)',
    color: '#E5E7EB',
    fontWeight: 600,
    fontSize: fs,
    whiteSpace: 'nowrap',
    lineHeight: 1
  };

  const imgSize = isSm ? 14 : 16;

  return (
    <a href={href} target="_blank" rel="noreferrer" style={style} aria-label={label} title={label}>
      <img
        src="https://ipfs.neus.network/ipfs/bafkreiefbrffecrifnzcn3hfksklw3vospkf244c5ijkizxtzbsm2vtnga"
        alt="NEUS"
        width={imgSize}
        height={imgSize}
        style={{ display: 'inline-block', width: imgSize, height: imgSize, borderRadius: 4 }}
      />
      <span>{label}</span>
    </a>
  );
}