import React, { forwardRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { ClaimCardIcon } from '../claimCardIcon.jsx';
import { buildClaimRow } from '../viewModel.js';

export const OpportunityCard = forwardRef(function OpportunityCard(
  { claim, proofId, listScope = 'all-opp', onSelect, demoHighlight = false },
  ref
) {
  const row = useMemo(() => buildClaimRow(claim, { proofId }), [claim, proofId]);
  const { readinessState, isReady, isLocked, explanation, claim: c } = row;

  const readinessRedundantWithFilter =
    (listScope === 'near' && !isReady && !isLocked) || (listScope === 'ready' && isReady);

  const open = (e) => {
    e?.stopPropagation();
    onSelect(c.id);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(e);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={readinessRedundantWithFilter ? `${c.title}. ${readinessState}.` : undefined}
      className={
        'group relative flex h-full min-h-[22rem] cursor-pointer flex-col overflow-hidden rounded-[var(--neus-radius-xl)] p-5 text-left transition-all duration-300 ' +
        (isLocked ? 'opacity-50 grayscale ' : 'hover:-translate-y-1 hover:bg-[var(--neus-bg-card-hover)] ') +
        (demoHighlight && !isLocked
          ? 'border border-[rgba(var(--neus-rgb-accent-primary)/0.3)] shadow-[0_0_24px_rgba(var(--neus-rgb-accent-primary)/0.08)] bg-[linear-gradient(180deg,rgba(var(--neus-rgb-accent-primary)/0.05)_0%,var(--neus-bg-card)_100%)]'
          : 'border border-[var(--neus-border-subtle)] bg-[var(--neus-bg-card)] shadow-[var(--neus-shadow-card)] hover:shadow-[var(--neus-shadow-card-hover)] hover:border-[var(--neus-border-hover)]')
      }
    >
      {/* Top row: Icon & Live Receipt Badge */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--neus-radius-md)] transition-transform duration-300 group-hover:scale-105"
        >
          <ClaimCardIcon verifierId={c.verifierId} label={c.title} className="text-primary" size={24} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-1.5 text-lg font-semibold leading-tight tracking-tight text-[var(--neus-text-primary)]">
          {c.title}
        </h3>
        <p className="mb-5 text-[0.875rem] leading-relaxed text-[var(--neus-text-secondary)] line-clamp-2">
          {explanation}
        </p>

        {/* Requires & Unlocks Structured Data */}
        <div
          className="mt-auto flex flex-col gap-3 rounded-[var(--neus-radius-md)] border border-[var(--neus-border-faint)] p-3.5"
          style={{ background: 'rgb(var(--neus-rgb-surface-rail) / 0.4)' }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-16 shrink-0 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--neus-text-muted)]">
              Requires
            </div>
            <div className="text-[0.8125rem] font-medium leading-snug text-[var(--neus-text-primary)]">
              {c.cardRequires}
            </div>
          </div>
          <div className="h-px w-full bg-[var(--neus-border-faint)]" />
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-16 shrink-0 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--neus-text-muted)]">
              Unlocks
            </div>
            <div className="text-[0.8125rem] font-medium leading-snug text-[var(--neus-primary)]">
              {c.cardUnlocks}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA & Status */}
      <div className="mt-5 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {!readinessRedundantWithFilter && (
            <>
              {isReady && !isLocked && (
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--neus-success)] shadow-[0_0_6px_rgba(var(--neus-rgb-state-success)/0.4)]" aria-hidden="true" />
              )}
              {c.trustStatusWhenPending && !isReady && !isLocked && (
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--neus-warning)] shadow-[0_0_6px_rgba(var(--neus-rgb-state-warning)/0.4)]" aria-hidden="true" />
              )}
              <span
                className={
                  'text-[0.75rem] font-bold uppercase tracking-wider ' +
                  (isReady
                    ? 'text-[var(--neus-success)]'
                    : isLocked
                      ? 'text-[var(--neus-text-muted)]'
                      : 'text-[var(--neus-warning)]')
                }
              >
                {readinessState}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={open}
          className={
            isLocked
              ? 'inline-flex h-9 items-center justify-center rounded-full border border-[var(--neus-border-faint)] bg-[var(--neus-bg-rail)] px-4 text-[0.8125rem] font-semibold text-[var(--neus-text-muted)] cursor-not-allowed'
              : 'inline-flex h-9 items-center justify-center rounded-full bg-[var(--neus-primary)] px-5 text-[0.8125rem] font-bold text-[#000] transition-all hover:bg-[var(--neus-primary-hover)] hover:shadow-[0_0_12px_rgba(var(--neus-rgb-accent-primary)/0.3)]'
          }
        >
          {isReady ? 'View receipt' : isLocked ? 'Unavailable' : 'Open claim'}
        </button>
      </div>
    </motion.div>
  );
});
