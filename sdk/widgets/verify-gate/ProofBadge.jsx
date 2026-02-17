"use client";
/**
 * NEUS ProofBadge Widget
 * Minimal verification badges for integrators
 * 
 * Design Philosophy:
 * - Non-intrusive, tiny by default
 * - Neutral colors - no forced green/red
 * - Integrators can theme via CSS variables
 * - Logo: inline data URL (CSP-safe); logoUrl prop overrides for custom branding
 * 
 * @license Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import NEUS_LOGO_DATA_URL from '../../neus-logo.svg';

// Default API base - can be overridden via prop
const DEFAULT_API_BASE = 'https://api.neus.network';

// Brand logo: inline SVG data URL (no external fetch, CSP-safe). logoUrl prop overrides.
const NeusLogo = ({ size = 12, logoUrl }) => (
  <img
    src={logoUrl ?? NEUS_LOGO_DATA_URL}
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{
      width: size,
      height: size,
      display: 'block',
      borderRadius: 2,
      flexShrink: 0,
      objectFit: 'contain'
    }}
  />
);

/**
 * ProofBadge - Minimal inline verification badge
 * Tiny, non-intrusive, neutral colors by default
 */
export function ProofBadge({
  proofId,
  qHash,
  proofUrlPattern = '/proof/:proofId',
  size = 'sm',
  uiLinkBase = 'https://neus.network',
  apiUrl = DEFAULT_API_BASE,
  proof = undefined,
  showChains = false,
  showLabel = true,
  logoUrl = undefined,
  onClick = undefined,
  className = ''
}) {
  const resolvedProofId = proofId || qHash;
  const [status, setStatus] = useState(() => {
    if (proof) {
      const proofStatus = proof.status || '';
      return proofStatus.includes('verified') ? 'verified' : 
             proofStatus.includes('pending') || proofStatus.includes('processing') ? 'pending' : 'failed';
    }
    return resolvedProofId ? 'pending' : 'unknown';
  });
  
  const [chainCount, setChainCount] = useState(() => {
    if (proof?.crosschain) {
      const total = proof.crosschain.totalChains || 0;
      const relayResults = proof.crosschain.relayResults || {};
      return total > 0 ? total : Object.keys(relayResults).length + (proof.crosschain.hubTxHash ? 1 : 0);
    }
    return 0;
  });

  useEffect(() => {
    if (!resolvedProofId || proof) return;
    
    let cancelled = false;
    
    async function checkStatus() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/verification/status/${resolvedProofId}`, {
          headers: { Accept: 'application/json' }
        });
        
        if (!res.ok) {
          if (!cancelled) setStatus('failed');
          return;
        }
        
        const json = await res.json();
        if (cancelled) return;
        
        const proofStatus = json?.data?.status || '';
        const isVerified = proofStatus.toLowerCase().includes('verified');
        const isPending = proofStatus.toLowerCase().includes('processing') || 
                          proofStatus.toLowerCase().includes('pending');
        
        setStatus(isVerified ? 'verified' : isPending ? 'pending' : 'failed');
        
        if (showChains && json?.data?.crosschain) {
          const cc = json.data.crosschain;
          const total = cc.totalChains || 0;
          const relayResults = cc.relayResults || {};
          const count = total > 0 ? total : Object.keys(relayResults).length + (cc.hubTxHash ? 1 : 0);
          setChainCount(count);
        }
        
      } catch (_) {
        if (!cancelled) setStatus('failed');
      }
    }
    
    checkStatus();
    
    return () => { cancelled = true; };
  }, [resolvedProofId, proof, apiUrl, showChains]);

  const base = String(uiLinkBase).replace(/\/$/, '');
  const href = resolvedProofId
    ? `${base}${String(proofUrlPattern).replace(':proofId', resolvedProofId).replace(':qHash', resolvedProofId)}`
    : base;
  
  // Minimal sizing
  const isSm = size === 'sm';
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;
  const gap = isSm ? 4 : 5;
  const padY = isSm ? 2 : 3;
  const padX = isSm ? 6 : 8;

  const label = status === 'verified' ? 'Verified' : 
                status === 'pending' ? 'Pending' : status === 'unknown' ? 'Unknown' : 'Unverified';

  // Neutral styling - rounded pill, not intrusive, easily themed
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap,
    textDecoration: 'none',
    padding: `${padY}px ${padX}px`,
    borderRadius: 9999, // rounded-full
    border: '1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))',
    background: 'var(--neus-badge-bg, rgba(148, 163, 184, 0.06))',
    color: 'var(--neus-badge-text, #94a3b8)',
    fontFamily: 'var(--neus-badge-font, inherit)',
    fontWeight: 500,
    fontSize,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ proofId: resolvedProofId, qHash: resolvedProofId, status, chainCount });
    }
  };

  const title = showChains && chainCount > 0 
    ? `${label} on ${chainCount} chain${chainCount === 1 ? '' : 's'}` 
    : label;

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      style={style}
      className={className}
      aria-label={title} 
      title={title}
      onClick={handleClick}
    >
      <NeusLogo size={logoSize} logoUrl={logoUrl} />
      {showLabel && <span>{label}</span>}
      {showChains && chainCount > 0 && (
        <span style={{ opacity: 0.7, fontSize: fontSize - 1 }}>
          · {chainCount}
        </span>
      )}
    </a>
  );
}

/**
 * SimpleProofBadge - Even more compact, just logo + optional text
 */
export function SimpleProofBadge({
  proofId,
  qHash,
  proofUrlPattern = '/proof/:proofId',
  uiLinkBase = 'https://neus.network',
  apiUrl = DEFAULT_API_BASE,
  size = 'sm',
  label = 'Verified',
  logoUrl = undefined,
  proof = undefined,
  onClick = undefined,
  className = ''
}) {
  const resolvedProofId = proofId || qHash;
  const [status, setStatus] = useState(() => {
    if (proof) {
      const proofStatus = proof.status || '';
      return proofStatus.includes('verified') ? 'verified' : 'failed';
    }
    return resolvedProofId ? 'pending' : 'unknown';
  });

  useEffect(() => {
    if (!resolvedProofId || proof) return;
    
    let cancelled = false;
    
    async function checkStatus() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/verification/status/${resolvedProofId}`, {
          headers: { Accept: 'application/json' }
        });
        
        if (!res.ok) {
          if (!cancelled) setStatus('failed');
          return;
        }
        
        const json = await res.json();
        if (cancelled) return;
        
        const isVerified = json?.success === true || 
                          json?.data?.status?.toLowerCase()?.includes('verified');
        setStatus(isVerified ? 'verified' : 'failed');
        
      } catch (_) {
        if (!cancelled) setStatus('failed');
      }
    }
    
    checkStatus();
    return () => { cancelled = true; };
  }, [resolvedProofId, proof, apiUrl]);

  const base = String(uiLinkBase).replace(/\/$/, '');
  const href = resolvedProofId
    ? `${base}${String(proofUrlPattern).replace(':proofId', resolvedProofId).replace(':qHash', resolvedProofId)}`
    : base;
  const isSm = size === 'sm';
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    padding: '2px 6px',
    borderRadius: 9999, // rounded-full
    border: '1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))',
    background: 'var(--neus-badge-bg, transparent)',
    color: 'var(--neus-badge-text, #94a3b8)',
    fontFamily: 'var(--neus-badge-font, inherit)',
    fontWeight: 500,
    fontSize,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ proofId: resolvedProofId, qHash: resolvedProofId, status });
    }
  };

  const displayLabel = status === 'verified' ? label : status === 'pending' ? 'Pending' : status === 'unknown' ? 'Unknown' : 'Unverified';

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      style={style}
      className={className}
      aria-label={displayLabel} 
      title={displayLabel}
      onClick={handleClick}
    >
      <NeusLogo size={logoSize} logoUrl={logoUrl} />
      <span>{displayLabel}</span>
    </a>
  );
}

/**
 * NeusPillLink - Minimal navigation link
 */
export function NeusPillLink({
  proofId,
  qHash,
  proofUrlPattern = '/proof/:proofId',
  uiLinkBase = 'https://neus.network',
  label = 'View',
  size = 'sm',
  logoUrl = undefined,
  onClick = undefined,
  className = ''
}) {
  const resolvedProofId = proofId || qHash;
  const base = String(uiLinkBase).replace(/\/$/, '');
  const href = resolvedProofId ? `${base}${String(proofUrlPattern).replace(':proofId', resolvedProofId).replace(':qHash', resolvedProofId)}` : base;

  const isSm = size === 'sm';
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    padding: '2px 6px',
    borderRadius: 9999, // rounded-full
    border: '1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))',
    background: 'var(--neus-badge-bg, transparent)',
    color: 'var(--neus-badge-text, #94a3b8)',
    fontFamily: 'var(--neus-badge-font, inherit)',
    fontWeight: 500,
    fontSize,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ proofId: resolvedProofId, qHash: resolvedProofId });
    }
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      style={style}
      className={className}
      aria-label={label} 
      title={label}
      onClick={handleClick}
    >
      <NeusLogo size={logoSize} logoUrl={logoUrl} />
      <span>{label}</span>
    </a>
  );
}

/**
 * VerifiedIcon - Just the logo, nothing else
 * For when you just want a tiny indicator
 */
export function VerifiedIcon({
  proofId,
  qHash,
  proofUrlPattern = '/proof/:proofId',
  uiLinkBase = 'https://neus.network',
  size = 14,
  logoUrl = undefined,
  tooltip = 'Proof',
  onClick = undefined,
  className = ''
}) {
  const resolvedProofId = proofId || qHash;
  const href = resolvedProofId
    ? `${String(uiLinkBase).replace(/\/$/, '')}${String(proofUrlPattern).replace(':proofId', resolvedProofId).replace(':qHash', resolvedProofId)}`
    : undefined;

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ proofId: resolvedProofId, qHash: resolvedProofId });
    }
  };

  const icon = (
    <span
      title={tooltip}
      className={className}
      style={{
        display: 'inline-flex',
        cursor: href || onClick ? 'pointer' : 'default',
        opacity: 0.85,
        transition: 'opacity 0.15s ease'
      }}
    >
      <NeusLogo size={size} logoUrl={logoUrl} />
    </span>
  );

  if (href) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        style={{ display: 'inline-flex', textDecoration: 'none' }}
        aria-label={tooltip}
      >
        {icon}
      </a>
    );
  }

  return icon;
}
