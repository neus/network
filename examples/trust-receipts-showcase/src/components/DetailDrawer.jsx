import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, Lock, ListTree, Sparkles, RefreshCw } from 'lucide-react';
import { NeusClient } from '@neus/sdk/client';
import { VerifyGate } from '@neus/sdk/widgets';
import { buildClaimRow } from '../viewModel.js';
import { CodePreview } from './CodePreview.jsx';
import { ReceiptPreview } from './ReceiptPreview.jsx';

const surface = { background: 'var(--neus-bg-elevated)' };

export function DetailDrawer({ claim, onClose, appId, apiUrl, hostedCheckoutUrl, proofId, onVerified }) {
  const [mode, setMode] = useState('preview');
  const [localProof, setLocalProof] = useState(null);
  const [eligBusy, setEligBusy] = useState(false);
  const [eligLine, setEligLine] = useState(null);

  const effectiveProof = localProof || proofId || null;
  const row = buildClaimRow(claim, { proofId: effectiveProof });

  useEffect(() => {
    setLocalProof(null);
    setMode('preview');
    setEligLine(null);
  }, [claim.id]);

  const handleVerified = useCallback(
    (res) => {
      const id = (typeof res?.qHash === 'string' && res.qHash) || (typeof res?.proofId === 'string' && res.proofId) || null;
      setLocalProof(id);
      onVerified(id);
    },
    [onVerified]
  );

  const runEligibilityCheck = useCallback(async () => {
    setEligBusy(true);
    setEligLine(null);
    try {
      const w = typeof window !== 'undefined' ? window.ethereum : null;
      if (!w || typeof w.request !== 'function') {
        setEligLine('No in-page signer. Use a browser with a provider, or run this flow through hosted verify.');
        return;
      }
      const acc = await w.request({ method: 'eth_requestAccounts' });
      const address = acc && acc[0] ? acc[0] : '';
      if (!address) {
        setEligLine('No account connected.');
        return;
      }
      const client = new NeusClient({ apiUrl, appId });
      const res = await client.gateCheck({
        address,
        verifierIds: [claim.verifierId],
        includePrivate: true,
        includeQHashes: true,
        wallet: w
      });
      const data = res?.data && typeof res.data === 'object' ? res.data : {};
      setEligLine(
        data.eligible === true
          ? 'Requirements met — a matching receipt is available.'
          : 'No matching receipt yet. Issue one to continue.'
      );
    } catch (e) {
      setEligLine(e?.message || 'Check failed.');
    } finally {
      setEligBusy(false);
    }
  }, [apiUrl, appId, claim.verifierId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const drawerHeader = (
    <>
      <h2
        id="drawer-claim-title"
        className="pr-10 text-xl font-semibold leading-tight tracking-tight sm:text-2xl"
        style={{ color: 'var(--neus-text-primary)' }}
      >
        {claim.title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="cm-drawer-kv cm-drawer-kv--req rounded-lg p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <ListTree size={14} className="shrink-0 text-primary" strokeWidth={1.9} aria-hidden="true" />
            <span className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: 'var(--neus-text-muted)' }}>
              Requires
            </span>
          </div>
          <p className="m-0 text-sm font-medium leading-snug" style={{ color: 'var(--neus-text-primary)' }}>
            {claim.requires}
          </p>
        </div>
        <div className="cm-drawer-kv cm-drawer-kv--unlock rounded-lg p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles size={14} className="shrink-0 text-[var(--neus-success)]" strokeWidth={1.9} aria-hidden="true" />
            <span className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: 'var(--neus-text-muted)' }}>
              Unlocks
            </span>
          </div>
          <p className="m-0 text-sm font-medium leading-snug" style={{ color: 'var(--neus-text-primary)' }}>
            {claim.unlocks}
          </p>
        </div>
      </div>
      <div className="rounded-lg p-3.5" style={{ border: '1px solid var(--neus-border-faint)', background: 'rgb(var(--neus-rgb-surface-card) / 0.3)' }}>
        <p className="mb-1.5 m-0 text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: 'var(--neus-text-muted)' }}>
          Why it matters
        </p>
        <p className="m-0 text-sm leading-relaxed" style={{ color: 'var(--neus-text-secondary)' }}>
          {claim.whyItMatters}
        </p>
      </div>
      <div
        className="neus-tabs-list neus-tabs-list--tight flex w-full max-w-[17rem] flex-nowrap"
        role="tablist"
        aria-label="Drawer view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'preview'}
          onClick={() => setMode('preview')}
          className={
            'neus-tabs-trigger neus-tabs-trigger--center ' + (mode === 'preview' ? 'neus-tabs-trigger--active' : '')
          }
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'code'}
          onClick={() => setMode('code')}
          className={'neus-tabs-trigger neus-tabs-trigger--center ' + (mode === 'code' ? 'neus-tabs-trigger--active' : '')}
        >
          Code
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      key="drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end"
      style={{ zIndex: 100 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-claim-title"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
        style={{ background: 'var(--neus-bg-overlay)', backdropFilter: 'var(--neus-backdrop-popover)' }}
      />
      <motion.aside
        key="drawer-aside"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 230 }}
        className="relative z-[101] flex h-full w-full max-w-[min(100vw,420px)] flex-col border-l p-5 sm:max-w-[420px] sm:px-6 sm:pb-5 sm:pt-5"
        style={{ ...surface, borderLeft: '1px solid var(--neus-border)' }}
      >
        <div className="mb-3 flex shrink-0 items-start justify-end">
          <button
            type="button"
            onClick={onClose}
            className="input-glass h-9 w-9 shrink-0 p-0"
            style={{ placeContent: 'center', display: 'grid' }}
            aria-label="Close"
          >
            <X size={16} color="currentColor" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 cm-scrollbar">
            {mode === 'preview' ? (
              <div className="flex min-h-full flex-col">
                <div className="space-y-5">
                  {drawerHeader}
                  <section>
                    <h4
                      className="mb-2.5 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--neus-text-muted)' }}
                    >
                      <ShieldCheck size={15} className="shrink-0 text-primary" aria-hidden="true" />
                      Requirements
                    </h4>
                    <div className="space-y-2">
                      {row.requirements.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-lg px-3.5 py-3"
                          style={{
                            border: '1px solid var(--neus-border-subtle)',
                            background: 'rgb(var(--neus-rgb-surface-card) / 0.4)'
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 pr-1">
                              <p className="m-0 text-sm font-semibold leading-snug" style={{ color: 'var(--neus-text-primary)' }}>
                                {req.label}
                              </p>
                              {req.verifierName ? (
                                <p
                                  className="m-0 mt-1 text-[0.7rem] font-medium leading-tight"
                                  style={{ color: 'var(--neus-text-muted)' }}
                                >
                                  {req.verifierName}
                                </p>
                              ) : null}
                            </div>
                            <div
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold"
                              style={
                                req.satisfied
                                  ? {
                                      borderColor: 'rgba(var(--neus-rgb-accent-primary) / 0.28)',
                                      color: 'var(--neus-primary)',
                                      background: 'rgba(var(--neus-rgb-accent-primary) / 0.08)'
                                    }
                                  : {
                                      borderColor: 'var(--neus-border-subtle)',
                                      color: 'var(--neus-text-muted)',
                                      background: 'rgb(var(--neus-rgb-surface-card) / 0.35)'
                                    }
                              }
                            >
                              {req.satisfied ? <CheckCircle2 size={12} strokeWidth={2.25} /> : <Lock size={12} strokeWidth={2.25} />}
                              {req.satisfied ? 'Receipt active' : 'Needs receipt'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <ReceiptPreview claim={claim} proofId={effectiveProof} />
                </div>
                <div className="mt-auto border-t pt-5" style={{ borderColor: 'var(--neus-border-subtle)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <button
                      type="button"
                      className="cm-check-elig w-full sm:w-auto sm:min-w-[9.5rem]"
                      onClick={runEligibilityCheck}
                      disabled={eligBusy}
                      title="Signed request to the proofs gate. Private matches count when you approve signing in the connected environment. No new receipt is created from this check alone."
                    >
                      <RefreshCw size={16} className={eligBusy ? 'animate-spin' : ''} aria-hidden="true" />
                      Check requirements
                    </button>
                    <div className="vg-gate min-w-0 flex-1">
                      <VerifyGate
                        appId={appId}
                        apiUrl={apiUrl}
                        hostedCheckoutUrl={hostedCheckoutUrl}
                        requiredVerifiers={[claim.verifierId]}
                        verifierData={{ [claim.verifierId]: claim.verifierData }}
                        buttonText="Issue receipt"
                        checkExisting
                        allowPrivateReuse
                        strategy="reuse-or-create"
                        qHash={effectiveProof || undefined}
                        proofId={effectiveProof || undefined}
                        onVerified={handleVerified}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  {eligLine && (
                    <p
                      className="m-0 mt-2 text-center text-xs sm:text-left"
                      style={{ color: 'var(--neus-text-muted)' }}
                      role="status"
                    >
                      {eligLine}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {drawerHeader}
                <div className="pt-0.5">
                  <CodePreview claim={claim} appId={appId} />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
