import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { LayoutGrid, ShieldCheck, Search, ExternalLink, Globe, BookOpen, Github } from 'lucide-react';
import neusMark from '../../../sdk/neus-logo.svg?url';
import { claimById, claims, FILTER_CATEGORIES, filterByUiCategory, getInitialDemoProofs } from './claims.js';
import { applyListScope, filterByQuery } from './viewModel.js';
import { DetailDrawer } from './components/DetailDrawer.jsx';
import { OpportunityCard } from './components/OpportunityCard.jsx';

function withEnvUrl(v, d) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (d === 'origin' && typeof window !== 'undefined') return window.location.origin;
  if (d === 'checkout' && typeof window === 'undefined') return 'https://neus.network/verify';
  if (d === 'checkout' && typeof window !== 'undefined') {
    return new URL('mock-checkout.html', window.location.origin).href;
  }
  if (d === 'api' && typeof window === 'undefined') return 'https://api.neus.network';
  if (d === 'api' && typeof window !== 'undefined') return window.location.origin;
  return 'https://api.neus.network';
}

export default function App() {
  const appId = import.meta.env.VITE_NEUS_APP_ID || 'local-demo';
  const apiUrl = withEnvUrl(import.meta.env.VITE_NEUS_API_URL, 'api');
  const hostedCheckoutUrl = withEnvUrl(import.meta.env.VITE_NEUS_HOSTED_CHECKOUT_URL, 'checkout');
  const [cat, setCat] = useState('all');
  const listScope = 'all-opp';
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [proofs, setProofs] = useState(() => ({ ...getInitialDemoProofs() }));

  const activeCategory = cat === 'all' ? 'All' : cat;

  const selected = useMemo(() => (selectedId ? claimById(selectedId) : null), [selectedId]);

  const filtered = useMemo(() => {
    const by = filterByUiCategory(claims, activeCategory);
    return filterByQuery(by, search);
  }, [activeCategory, search]);

  const visible = useMemo(
    () => applyListScope(filtered, listScope, proofs),
    [filtered, listScope, proofs]
  );

  const handleVerifiedFromDrawer = useCallback((claimId, id) => {
    if (!id) return;
    setProofs((s) => ({ ...s, [claimId]: { proofId: id } }));
  }, []);

  const onDrawerVerified = useCallback(
    (id) => {
      if (selected) handleVerifiedFromDrawer(selected.id, id);
    },
    [selected, handleVerifiedFromDrawer]
  );

  return (
    <div className="flex min-h-screen bg-bg font-body text-text-p selection:bg-primary/20">
      <aside
        className="z-40 flex w-[min(100vw,220px)] flex-shrink-0 flex-col p-6 sm:w-[220px]"
        style={{ borderRight: '1px solid var(--neus-border-subtle)', background: 'var(--neus-bg-rail)' }}
      >
        <div className="mb-9 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
            <img src={neusMark} width={32} height={32} className="h-7 w-7" alt="" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">NEUS</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          <button
            type="button"
            className="group flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-primary"
            style={{
              borderColor: 'rgba(var(--neus-rgb-accent-primary-dim) / 0.3)',
              background: 'rgba(var(--neus-rgb-accent-primary) / 0.1)'
            }}
          >
            <span className="flex items-center gap-2.5">
              <LayoutGrid size={18} className="shrink-0" />
              <span className="text-[13px] font-medium">Showcase</span>
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(152,192,239,0.7)]" />
          </button>
          <a
            href="https://neus.network/verify"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-text-m transition-all hover:bg-white/5 hover:text-text-s"
            target="_blank"
            rel="noreferrer"
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="shrink-0" />
              <span className="text-[13px] font-medium">Verify</span>
            </span>
            <ExternalLink size={12} className="shrink-0 text-text-m opacity-60" aria-hidden="true" />
          </a>
          <a
            href="https://neus.network"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-text-m transition-all hover:bg-white/5 hover:text-text-s"
            target="_blank"
            rel="noreferrer"
          >
            <span className="flex items-center gap-2.5">
              <Globe size={18} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[13px] font-medium">App</span>
            </span>
            <ExternalLink size={12} className="shrink-0 text-text-m opacity-60" aria-hidden="true" />
          </a>
          <a
            href="https://docs.neus.network"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-text-m transition-all hover:bg-white/5 hover:text-text-s"
            target="_blank"
            rel="noreferrer"
          >
            <span className="flex items-center gap-2.5">
              <BookOpen size={18} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[13px] font-medium">Docs</span>
            </span>
            <ExternalLink size={12} className="shrink-0 text-text-m opacity-60" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/neus/network"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-text-m transition-all hover:bg-white/5 hover:text-text-s"
            target="_blank"
            rel="noreferrer"
          >
            <span className="flex items-center gap-2.5">
              <Github size={18} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[13px] font-medium">GitHub</span>
            </span>
            <ExternalLink size={12} className="shrink-0 text-text-m opacity-60" aria-hidden="true" />
          </a>
        </nav>
      </aside>

      <main className="relative flex-1 overflow-y-auto p-6 sm:p-10 sm:pr-8">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <h1 className="mb-1.5 text-[1.6rem] font-semibold leading-tight tracking-tight sm:text-[1.875rem]">
              Trust Marketplace
            </h1>
            <p className="max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--neus-text-secondary)' }}>
              One receipt model for access, rewards, and agents. Works in the browser, on the server, and in hosted
              verify when you do not have a signer in-page.
            </p>
          </div>
          <div className="min-w-0 max-w-full">
            <div className="group relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
                style={{ color: 'var(--neus-text-muted)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                placeholder="Search"
                className="input-glass h-10 w-full min-w-[8rem] pl-9 pr-3 sm:w-[220px] md:w-[260px]"
              />
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-4 sm:mb-8">
          <div className="neus-tabs-list neus-tabs-list--tight neus-tabs-list--no-rule" role="tablist" aria-label="Claim categories">
            {FILTER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === cat}
                onClick={() => {
                  setCat(c.id);
                  if (selectedId) {
                    const s = claimById(selectedId);
                    if (s) {
                      const inCat = c.id === 'all' || c.id === s.uiCategory;
                      if (!inCat) setSelectedId(null);
                    }
                  }
                }}
                className={'neus-tabs-trigger ' + (c.id === cat ? 'neus-tabs-trigger--active' : '')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((c) => (
              <OpportunityCard
                key={c.id}
                claim={c}
                proofId={proofs[c.id]?.proofId || null}
                listScope={listScope}
                demoHighlight={Boolean(c.demoHighlight)}
                onSelect={setSelectedId}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {selected && (
        <DetailDrawer
          key={selected.id}
          claim={selected}
          onClose={() => setSelectedId(null)}
          appId={appId}
          apiUrl={apiUrl}
          hostedCheckoutUrl={hostedCheckoutUrl}
          proofId={proofs[selected.id]?.proofId || null}
          onVerified={(id) => onDrawerVerified(id)}
        />
      )}
    </div>
  );
}
