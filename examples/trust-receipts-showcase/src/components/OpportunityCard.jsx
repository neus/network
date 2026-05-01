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
      whileHover={{ borderColor: 'var(--neus-border-hover)' }}
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
        'cm-card group flex h-full min-h-0 cursor-pointer flex-col rounded-[var(--neus-radius-lg)] p-4 sm:p-5 ' +
        (isLocked ? 'opacity-60' : '') +
        (demoHighlight
          ? ' border-[var(--neus-border)] ring-1 ring-inset ring-[rgba(var(--neus-rgb-accent-primary)/0.2)] [background:linear-gradient(180deg,rgba(var(--neus-rgb-accent-primary)/0.11)_0%,rgb(var(--neus-rgb-surface-elevated)/0.5)_100%)]'
          : '')
      }
      style={demoHighlight && !isLocked ? { boxShadow: '0 0 0 1px rgba(var(--neus-rgb-accent-primary)/0.12)' } : undefined}
    >
      <div
        className="mb-2 flex min-h-[1.625rem] flex-shrink-0 items-center"
        aria-hidden={!(demoHighlight && isReady && !isLocked)}
      >
        {demoHighlight && isReady && !isLocked && (
          <div
            className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
            style={{
              borderColor: 'rgba(var(--neus-rgb-accent-primary) / 0.32)',
              color: 'var(--neus-primary)',
              background: 'rgba(var(--neus-rgb-accent-primary) / 0.1)'
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neus-success)]" aria-hidden="true" />
            Live receipt
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 cursor-pointer flex-col">
        <div className="flex min-h-0 flex-1 gap-3.5 sm:gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--neus-radius-md)] border transition-colors group-hover:[border-color:rgba(var(--neus-rgb-accent-primary)/0.32)]"
            style={{
              borderColor: 'var(--neus-border-subtle)',
              background: 'rgb(var(--neus-rgb-surface-card) / 0.55)'
            }}
          >
            <ClaimCardIcon verifierId={c.verifierId} label={c.title} className="text-primary" size={24} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <h3 className="mb-1.5 min-h-[2.75rem] text-[0.9375rem] font-semibold leading-snug text-[var(--neus-text-primary)] sm:min-h-[2.875rem] sm:text-base line-clamp-2">
              {c.title}
            </h3>
            <p className="mb-3 min-h-[2.625rem] text-[0.8125rem] leading-relaxed text-[var(--neus-text-secondary)] sm:min-h-[2.75rem] line-clamp-2">
              {explanation}
            </p>
            <div
              className="mt-auto min-h-[4.5rem] rounded-[var(--neus-radius-md)] border px-3 py-2.5"
              style={{ borderColor: 'var(--neus-border-faint)', background: 'rgb(var(--neus-rgb-surface-card) / 0.35)' }}
            >
              <div className="grid h-full min-h-0 grid-cols-2 gap-x-3 gap-y-1 text-[0.75rem] leading-snug">
                <div className="min-w-0">
                  <div className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--neus-text-muted)]">
                    Requires
                  </div>
                  <div className="line-clamp-2 font-medium text-[var(--neus-text-primary)]">{c.cardRequires}</div>
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--neus-text-muted)]">
                    Unlocks
                  </div>
                  <div className="line-clamp-2 font-medium text-[var(--neus-text-primary)]">{c.cardUnlocks}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-[3.25rem] flex-shrink-0 items-end justify-between gap-3 border-t border-[var(--neus-border-faint)] pt-3.5">
        <div className="flex min-h-[2.5rem] min-w-0 flex-1 flex-col justify-end">
          {!readinessRedundantWithFilter && (
            <>
              <div className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--neus-text-muted)]">
                Status
              </div>
              <div className="flex min-h-[1.25rem] min-w-0 items-center gap-2">
                {isReady && !isLocked && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--neus-success)]" aria-hidden="true" />
                )}
                {c.trustStatusWhenPending && !isReady && !isLocked && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--neus-text-muted)]" aria-hidden="true" />
                )}
                <span
                  className={
                    'text-[0.8125rem] font-medium ' +
                    (isReady
                      ? 'text-primary'
                      : isLocked
                        ? 'text-[var(--neus-text-muted)]'
                        : 'text-[var(--neus-text-secondary)]')
                  }
                >
                  {readinessState}
                </span>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={open}
          className={
            isLocked
              ? 'neus-card-cta neus-card-cta--disabled self-end'
              : 'btn-primary self-end px-4 py-2.5 text-[0.8125rem] font-semibold'
          }
        >
          {isReady ? 'View receipt' : isLocked ? 'Unavailable' : 'Open claim'}
        </button>
      </div>
    </motion.div>
  );
});
