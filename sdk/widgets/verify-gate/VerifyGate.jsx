"use client";
/**
 * NEUS VerifyGate Widget
 * React component for gated content verification
 * 
 * Supported verifiers:
 * - ownership-basic: Content/authorship claims
 * - ownership-pseudonym: Pseudonymous identity
 * - nft-ownership: NFT ownership (ERC-721/1155)
 * - token-holding: Token balance (ERC-20)
 * - ownership-dns-txt: Domain ownership via DNS
 * - wallet-link: Multi-wallet identity linking
 * - contract-ownership: Smart contract ownership
 * - wallet-risk: Wallet risk assessment
 * - agent-identity: AI/bot identity (ERC-8004)
 * - agent-delegation: Agent authorization
 * - ai-content-moderation: Content safety verification
 * 
 * Proof strategies:
 * - 'reuse': Use existing valid proof (static facts)
 * - 'fresh': Always create new proof (dynamic facts)
 * - 'reuse-or-create': Use existing if valid, else create (default)
 * 
 * @license Apache-2.0
 */
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { NeusClient } from '@neus/sdk/client';

// CSS variable-based theming for consistency with host applications
const THEME = {
  // Primary colors - use CSS variables with fallbacks
  primary: 'var(--neus-primary, #98C0EF)',
  primaryHover: 'var(--neus-primary-hover,rgb(91, 126, 182))',
  success: 'var(--neus-success, #22c55e)',
  error: 'var(--neus-error, #ef4444)',
  warning: 'var(--neus-warning, #f59e0b)',
  // Background colors
  bgDark: 'var(--neus-bg-dark, rgba(2, 6, 23, 0.95))',
  bgCard: 'var(--neus-bg-card, rgba(15, 23, 42, 0.8))',
  // Text colors
  textPrimary: 'var(--neus-text-primary, #ffffff)',
  textSecondary: 'var(--neus-text-secondary, #94a3b8)',
  textMuted: 'var(--neus-text-muted, #64748b)',
  // Border colors
  border: 'var(--neus-border, rgba(148, 163, 184, 0.2))',
  borderHover: 'var(--neus-border-hover, rgba(61, 114, 201, 0.4))',
};

/**
 * Default max-age (ms) for proof reuse.
 *
 * For point-in-time / expiring verifiers, reuse should be bounded to prevent stale reads.
 * Values align with `spec/VERIFIERS.json` recommendedMaxAgeMs.
 */
const DEFAULT_MAX_AGE_MS_BY_VERIFIER = {
  // point_in_time (recommended: 1 hour)
  'ownership-dns-txt': 60 * 60 * 1000,
  'contract-ownership': 60 * 60 * 1000,
  'nft-ownership': 60 * 60 * 1000,
  'token-holding': 60 * 60 * 1000,
  'wallet-risk': 60 * 60 * 1000,
  // expiring (recommended: 7 days)
  'agent-delegation': 7 * 24 * 60 * 60 * 1000
};

const maxAgeMsForVerifier = (verifierId, overrideMs) => {
  if (typeof overrideMs === 'number') return overrideMs;
  return DEFAULT_MAX_AGE_MS_BY_VERIFIER[verifierId];
};

// Verifiers that can be created via the SDK wallet flow.
const CREATABLE_VERIFIERS = new Set([
  'ownership-basic',
  'ownership-pseudonym',
  'ownership-dns-txt',
  'contract-ownership',
  'nft-ownership',
  'token-holding',
  'wallet-link',
  'wallet-risk',
  'agent-identity',
  'agent-delegation',
  'ai-content-moderation'
]);


// Logo component (inline SVG; no external assets required)
const NeusLogo = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    style={{
      width: size,
      height: size,
      marginRight: 8,
      verticalAlign: 'middle',
      borderRadius: 4,
      flexShrink: 0
    }}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" opacity="0.18" />
    <path
      d="M7 16V8h2.1l4.9 5.9V8H17v8h-2.1L10 10.1V16H7z"
      fill="currentColor"
      opacity="0.9"
    />
  </svg>
);

// Loading spinner component
const Spinner = ({ size = 16 }) => (
  <svg 
    className="animate-spin" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    style={{ marginRight: 8 }}
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="3"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export function VerifyGate({
  requiredVerifiers = ['ownership-basic'],
  onVerified = undefined,
  apiUrl = undefined,
  style = undefined,
  children = undefined,
  // Verifier configuration
  verifierOptions = undefined,
  verifierData = undefined,
  // Proof creation options (privacy, discoverability, content storage)
  proofOptions = undefined,
  // Display options
  showBrand = true,
  disabled = false,
  buttonText = undefined, // Custom button text
  // Private proof access mode
  mode = 'create', // 'create' or 'access'
  qHash = null, // Required when mode='access'
  // Proof strategy for static vs dynamic verification
  // - 'reuse': Always use existing proof if available (best for static facts)
  // - 'fresh': Always create new proof (best for dynamic facts that change)
  // - 'reuse-or-create': Use existing if valid, else create new (default)
  strategy = 'reuse-or-create',
  // Gate-first options (used when strategy includes 'reuse')
  checkExisting = true, // Check for existing proofs before verification
  maxProofAgeMs = undefined, // Optional max age override (ms) for proof reuse
  allowPrivateReuse = true, // Allow owner-signed lookups for private proofs (interactive)
  // Callbacks
  onStateChange = undefined,
  onError = undefined
}) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [existingProofs, setExistingProofs] = useState(null);
  const [operation, setOperation] = useState('verify'); // 'verify' | 'reuse' | 'access'
  
  const client = useMemo(() => new NeusClient({ apiUrl }), [apiUrl]);

  // Support multi-verifier requests
  const verifierList = useMemo(() => {
    return Array.isArray(requiredVerifiers) && requiredVerifiers.length > 0 
      ? requiredVerifiers 
      : ['ownership-basic'];
  }, [requiredVerifiers]);

  const primaryVerifier = verifierList[0];
  
  // Only check existing proofs if strategy allows reuse
  const shouldCheckExisting = checkExisting && strategy !== 'fresh';

  const buildGateRequirements = useCallback(() => {
    return verifierList.map(verifierId => ({
      verifierId,
      ...(maxAgeMsForVerifier(verifierId, maxProofAgeMs) && { maxAgeMs: maxAgeMsForVerifier(verifierId, maxProofAgeMs) })
    }));
  }, [verifierList, maxProofAgeMs]);

  const applySatisfiedGateResult = useCallback((gateResult, address) => {
    if (!gateResult?.satisfied) return false;

    setNotice(null);
    setError(null);
    setState('verified');
    setExistingProofs(gateResult);

    const existingProof = gateResult.existing?.[primaryVerifier];
    if (existingProof && onVerified) {
      onVerified({
        qHash: existingProof.qHash,
        address: existingProof.walletAddress || address,
        verifierIds: verifierList,
        verifiedVerifiers: existingProof.verifiedVerifiers || [],
        existing: true,
        proofsByVerifierId: gateResult.existing || {},
        statusUrl: existingProof.qHash
          ? `${apiUrl || 'https://api.neus.network'}/api/v1/verification/status/${existingProof.qHash}`
          : null
      });
    }

    return true;
  }, [apiUrl, onVerified, primaryVerifier, verifierList]);

  const getOrRequestWalletAddress = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet provider available');
    }

    // Prefer existing connection without prompting.
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      accounts = await window.ethereum.request({ method: 'eth_accounts' });
    }
    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet accounts available');
    }
    return accounts[0];
  }, []);

  const tryPrivateReuse = useCallback(async (address) => {
    // Owner-signed lookup: fetch private proofs, then evaluate locally.
    setOperation('reuse');
    setState('signing');

    const result = await client.getPrivateProofsByWallet(
      address,
      { limit: 200, offset: 0 },
      typeof window !== 'undefined' ? window.ethereum : null
    );

    const proofs = result?.proofs || [];
    const gateResult = await client.checkGate({
      walletAddress: address,
      requirements: buildGateRequirements(),
      proofs
    });

    setExistingProofs(gateResult);
    return gateResult;
  }, [client, buildGateRequirements]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Gate-first: Check for existing proofs on mount and wallet connect
  useEffect(() => {
    if (!shouldCheckExisting || mode === 'access') return;
    
    const checkExistingProofs = async () => {
      try {
        // Get wallet address
        if (typeof window === 'undefined' || !window.ethereum) return;
        
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) return;
        
        const address = accounts[0];
        setWalletAddress(address);
        
        // Check gate with current requirements (public/discoverable proofs)
        const gateResult = await client.checkGate({
          walletAddress: address,
          requirements: buildGateRequirements()
        });
        
        setExistingProofs(gateResult);
        applySatisfiedGateResult(gateResult, address);
      } catch (err) {
        // Silently fail - gate check is optional enhancement
      }
    };
    
    checkExistingProofs();
    
    // Re-check on wallet account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = () => {
        setWalletAddress(null);
        setExistingProofs(null);
        if (state === 'verified') setState('idle');
        checkExistingProofs();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [shouldCheckExisting, mode, client, buildGateRequirements, applySatisfiedGateResult, state]);

  // Standard verification flow
  const handleClick = useCallback(async () => {
    if (disabled || isProcessing) return;
    
    // If already verified (from gate check), do nothing
    if (state === 'verified' && existingProofs?.satisfied) {
      return;
    }
    
    setError(null);
    setNotice(null);
    
    // Gate-first: Check existing public/discoverable proofs before verification (respects strategy)
    if (shouldCheckExisting && walletAddress) {
      try {
        const gateResult = await client.checkGate({
          walletAddress,
          requirements: buildGateRequirements()
        });
        
        if (applySatisfiedGateResult(gateResult, walletAddress)) return;
      } catch (err) {
        // Continue to verification if gate check fails
      }
    }

    try {
      if (mode === 'access') {
        setOperation('access');
        setIsProcessing(true);
        setState('signing');

        // Private proof access mode - requires wallet signature
        if (!qHash) {
          throw new Error('qHash is required for access mode');
        }
        
        setState('verifying');
        
        // Use SDK's private access method with wallet signature
        const privateData = await client.getPrivateStatus(qHash);
        
        setState('verified');
        
        onVerified?.({
          qHash,
          data: privateData.data,
          mode: 'access',
          statusUrl: privateData.statusUrl
        });
        
      } else if (strategy === 'reuse') {
        // Reuse-only: never creates new proofs.
        setOperation('reuse');

        if (!allowPrivateReuse) {
          setNotice('No existing proof was found.');
          return;
        }

        setIsProcessing(true);
        const address = walletAddress || await getOrRequestWalletAddress();
        setWalletAddress(address);

        const gateResult = await tryPrivateReuse(address);
        if (applySatisfiedGateResult(gateResult, address)) return;

        setState('idle');
        setNotice('No matching proof was found. Create a proof to continue.');
      } else {
        // Standard verification creation mode
        setOperation('verify');
        setIsProcessing(true);
        setState('signing');

        const resolvedProofOptions = {
            privacyLevel: 'private',
            publicDisplay: false,
            storeOriginalContent: false,
          ...(proofOptions && typeof proofOptions === 'object' ? proofOptions : {}),
            ...(verifierOptions && { verifierOptions })
        };
        
        const buildDataForVerifier = (verifierId) => {
          if (!CREATABLE_VERIFIERS.has(verifierId)) {
            throw new Error(`${verifierId} cannot be created via the wallet flow. It requires deployment configuration.`);
          }

          const explicit = verifierData && verifierData[verifierId];
          if (explicit && typeof explicit === 'object') return explicit;

          if (verifierId === 'ownership-basic') {
            // ownership-basic can be created from a simple content string
            return null;
          }
          if (verifierId === 'wallet-risk') {
            // wallet-risk requires an object, but defaults walletAddress to the connected wallet
            return {};
          }

          throw new Error(`${verifierId} requires explicit verifierData`);
        };

        const verifyOne = async (verifierId) => {
          const dataForVerifier = buildDataForVerifier(verifierId);
          const params =
            verifierId === 'ownership-basic' && dataForVerifier === null
              ? {
                  verifier: 'ownership-basic',
                  content: verifierData?.['ownership-basic']?.content || `NEUS verification (${verifierId})`,
                  options: resolvedProofOptions
                }
              : {
                  verifier: verifierId,
                  data: dataForVerifier,
                  options: resolvedProofOptions
                };

          setState('signing');
          const created = await client.verify(params);
          setState('verifying');
          const qHashToCheck = created.qHash || created?.data?.qHash;
          const final = await client.pollProofStatus(qHashToCheck, { interval: 3000, timeout: 60000 });

          const verifiedVerifiers = final?.data?.verifiedVerifiers || [];
          const verifierResult = verifiedVerifiers.find(v => v.verifierId === verifierId);
          if (!verifierResult || verifierResult.verified !== true) {
            throw new Error(`Verification failed for ${verifierId}`);
          }

        const hubTx = final?.data?.hubTransaction || {};
        const crosschain = final?.data?.crosschain || {};
        const txHash = hubTx?.txHash || crosschain?.hubTxHash || null;
        
          return {
            verifierId,
            qHash: final.qHash,
            address: final?.data?.walletAddress,
            txHash,
            verifiedVerifiers,
            statusUrl: final?.statusUrl
          };
        };

        const results = [];
        for (const verifierId of verifierList) {
          results.push(await verifyOne(verifierId));
        }

        setState('verified');

        const last = results[results.length - 1];
        onVerified?.({
          qHash: last?.qHash,
          qHashes: results.map(r => r.qHash),
          address: last?.address,
          txHash: last?.txHash,
          verifierIds: verifierList,
          verifiedVerifiers: last?.verifiedVerifiers,
          statusUrl: last?.statusUrl,
          results
        });
      }

    } catch (err) {
      const errorMessage = err?.message || (mode === 'access' ? 'Access failed' : 'Verification failed');
      setError(errorMessage);
      setState('error');
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    mode,
    qHash,
    verifierList,
    client,
    verifierOptions,
    verifierData,
    proofOptions,
    onVerified,
    onError,
    shouldCheckExisting,
    walletAddress,
    existingProofs,
    strategy,
    allowPrivateReuse,
    buildGateRequirements,
    applySatisfiedGateResult,
    getOrRequestWalletAddress,
    tryPrivateReuse,
    state
  ]);

  const handleReuseExisting = useCallback(async () => {
    if (disabled || isProcessing) return;
    if (mode === 'access') return;
    if (!allowPrivateReuse) return;

    setError(null);
    setNotice(null);

    try {
      setIsProcessing(true);
      const address = walletAddress || await getOrRequestWalletAddress();
      setWalletAddress(address);

      const gateResult = await tryPrivateReuse(address);
      if (applySatisfiedGateResult(gateResult, address)) return;

      setState('idle');
      setNotice('No matching proof was found. Verify to create a proof.');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to access private proofs';
      setError(errorMessage);
      setState('error');
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, mode, allowPrivateReuse, walletAddress, getOrRequestWalletAddress, tryPrivateReuse, applySatisfiedGateResult, onError]);

  // Widget state labels
  const getLabel = () => {
    if (buttonText) return buttonText;
    
    if (mode === 'access') {
      return {
    idle: 'Sign to view',
    signing: 'Waiting for signature...',
    verifying: 'Accessing...',
        verified: 'Access granted',
        error: 'Retry'
      }[state];
    }
    
    if (strategy === 'reuse') {
      return {
        idle: 'Check proofs',
        signing: 'Waiting for signature...',
        verifying: 'Checking...',
        verified: 'Verified',
        error: 'Retry'
      }[state];
    }
    
    return {
      idle: 'Verify with NEUS',
      signing: 'Waiting for signature...',
      verifying: operation === 'reuse' ? 'Checking...' : 'Verifying...',
      verified: 'Verified',
      error: 'Retry'
    }[state];
  };

  // Button style based on state
  const buttonBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 500,
    fontSize: '14px',
    cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled || isProcessing ? 0.6 : 1,
    fontFamily: 'inherit',
  };

  const getButtonStyle = () => {
    if (state === 'verified') {
      return {
        ...buttonBaseStyle,
        background: `rgba(34, 197, 94, 0.15)`,
        color: THEME.success,
        border: `1px solid rgba(34, 197, 94, 0.3)`,
      };
    }
    if (state === 'error') {
      return {
        ...buttonBaseStyle,
        background: `rgba(239, 68, 68, 0.15)`,
        color: THEME.error,
        border: `1px solid rgba(239, 68, 68, 0.3)`,
      };
    }
    if (state === 'signing' || state === 'verifying') {
      return {
        ...buttonBaseStyle,
        background: `rgba(61, 114, 201, 0.15)`,
        color: '#98c0ef',
        border: `1px solid rgba(61, 114, 201, 0.3)`,
      };
    }
    // Default idle state
    return {
      ...buttonBaseStyle,
      background: THEME.primary,
      color: THEME.textPrimary,
      border: 'none',
      boxShadow: '0 4px 14px rgba(61, 114, 201, 0.25)',
    };
  };

  // If children provided, render as gate wrapper
  if (children) {
    // Show children only when verified
    if (state === 'verified') {
      return <>{children}</>;
    }
    
    // Show verification button when not verified
    return (
      <div style={{ textAlign: 'center', padding: '20px', ...style }}>
        <button 
          onClick={handleClick} 
          disabled={disabled || isProcessing}
          style={getButtonStyle()}
        >
          {(state === 'signing' || state === 'verifying' || state.startsWith('zkpassport')) && (
            <Spinner size={16} />
          )}
          {showBrand && state === 'idle' && <NeusLogo size={16} />}
          {state === 'verified' && (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <span>{getLabel()}</span>
        </button>
        {notice && (
          <div style={{
            color: THEME.textSecondary,
            marginTop: '10px',
            fontSize: '13px',
            padding: '8px 12px',
            background: 'rgba(148, 163, 184, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.14)'
          }}>
            {notice}
          </div>
        )}
        {mode !== 'access' && allowPrivateReuse && shouldCheckExisting && strategy !== 'reuse' && state === 'idle' && (
          <button
            type="button"
            onClick={handleReuseExisting}
            disabled={disabled || isProcessing}
            style={{
              marginTop: notice ? '10px' : '12px',
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: THEME.textSecondary,
              fontSize: '12px',
              cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              opacity: disabled || isProcessing ? 0.6 : 0.9
            }}
          >
            Already verified? Sign to reuse existing proofs.
          </button>
        )}
        {error && (
          <div style={{ 
            color: THEME.error, 
            marginTop: '8px', 
            fontSize: '13px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Render as standalone button
  return (
    <button 
      onClick={handleClick} 
      style={{ ...getButtonStyle(), ...style }}
      disabled={disabled || isProcessing}
    >
      {(state === 'signing' || state === 'verifying' || state.startsWith('zkpassport')) && (
        <Spinner size={16} />
      )}
      {showBrand && state === 'idle' && <NeusLogo size={16} />}
      {state === 'verified' && (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      <span>{getLabel()}</span>
      {error && <span style={{ opacity: 0.8, marginLeft: '8px' }}> — {error}</span>}
    </button>
  );
}
