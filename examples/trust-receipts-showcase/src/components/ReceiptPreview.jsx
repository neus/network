import React from 'react';
import neusMark from '../../../../sdk/neus-logo.svg?url';
import { getReceiptLineDetails } from '../claims.js';

const PLACEHOLDER = '0x7a2f4c9e1b8d0f3a5c6e7d8b9a0f1e2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';

function shortId(id) {
  if (typeof id !== 'string' || id.length < 18) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function ReceiptPreview({ claim, proofId }) {
  if (!claim) {
    return (
      <div
        className="flex min-h-[3.5rem] items-center rounded-lg px-3.5 py-2.5 text-sm"
        style={{ border: '1px solid var(--neus-border-subtle)', color: 'var(--neus-text-muted)' }}
      >
        <p className="m-0 w-full text-center text-[0.8125rem]">Select a claim to preview a receipt</p>
      </div>
    );
  }

  const isLive = Boolean(proofId);
  const id = proofId || PLACEHOLDER;
  const d = isLive ? getReceiptLineDetails(claim) : null;
  const showRich = Boolean(d);

  return (
    <div
      className="rounded-lg p-3.5"
      style={{
        border: '1px solid var(--neus-border-subtle)',
        background: isLive ? 'rgba(var(--neus-rgb-accent-primary) / 0.07)' : 'rgb(var(--neus-rgb-surface-card) / 0.35)',
        boxShadow: isLive ? 'inset 0 0 0 1px rgba(var(--neus-rgb-accent-primary) / 0.12)' : 'none'
      }}
    >
      <div className="mb-1.5 flex items-start gap-2.5">
        <img className="h-5 w-5 rounded" src={neusMark} width={20} height={20} alt="" />
        <div>
          <p
            className="mb-0.5 text-[0.65rem] font-medium uppercase tracking-wide"
            style={{ color: 'var(--neus-text-muted)' }}
          >
            Receipt
          </p>
          <p className="m-0 text-[0.95rem] font-semibold" style={{ color: 'var(--neus-text-primary)' }}>
            {claim.title}
          </p>
        </div>
      </div>

      {showRich && d && (
        <div className="mb-3 space-y-1.5 border-t border-[var(--neus-border-faint)] pt-3 text-[0.8125rem]">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--neus-text-muted)]">Subject</span>
            <span className="font-medium text-[var(--neus-text-primary)]">{d.subject}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--neus-text-muted)]">Claim</span>
            <span className="text-right font-medium text-[var(--neus-text-primary)]">{d.claimLine}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--neus-text-muted)]">Status</span>
            <span className="font-medium" style={{ color: 'var(--neus-primary)' }}>
              {d.status}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--neus-text-muted)]">Privacy</span>
            <span className="text-right text-[var(--neus-text-secondary)]">{d.privacy}</span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
            <span className="shrink-0 text-[var(--neus-text-muted)]">Works across</span>
            <span className="text-[var(--neus-text-secondary)] sm:text-right">{d.worksAcross}</span>
          </div>
        </div>
      )}

      <p className="mb-0.5 text-[0.65rem] font-medium uppercase tracking-wide" style={{ color: 'var(--neus-text-muted)' }}>
        Proof ID
      </p>
      <p
        className="m-0 font-mono text-[0.85rem] leading-tight"
        style={{ color: isLive ? 'var(--neus-primary)' : 'var(--neus-text-muted)' }}
        title={id}
      >
        {shortId(id)}
      </p>
    </div>
  );
}
