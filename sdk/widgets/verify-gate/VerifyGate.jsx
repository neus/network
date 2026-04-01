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
 * - agent-identity: Portable agent identity (wallet-anchored)
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
import NEUS_LOGO_DATA_URL from '../../neus-logo.svg';

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

// Verifiers that require hosted interactive checkout (OAuth / ZK).
const INTERACTIVE_VERIFIERS = new Set([
  'ownership-social',
  'ownership-org-oauth',
  'proof-of-human'
]);

const DEFAULT_HOSTED_CHECKOUT_URL = 'https://neus.network/verify';
const HOSTED_CHECKOUT_MESSAGE_TYPE = 'neus_checkout_done';


// Logo component: inline data URL (CSP-safe, no external fetch)
const NeusLogo = ({ size = 16 }) => (
  <img
    src={NEUS_LOGO_DATA_URL}
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{
      width: size,
      height: size,
      marginRight: 8,
      verticalAlign: 'middle',
      borderRadius: 4,
      flexShrink: 0,
      objectFit: 'contain',
      display: 'block'
    }}
  />
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
  appId = undefined,
  sponsorGrant = undefined,
  paymentSignature = undefined,
  extraHeaders = undefined,
  hostedCheckoutUrl = undefined,
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
  proofId = null, // Standard proof identifier for mode='access'
  qHash = null, // Deprecated alias (same value)
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
  onError = undefined,
  wallet = undefined,
  chain = undefined,
  signatureMethod = undefined
}) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [existingProofs, setExistingProofs] = useState(null);
  const [operation, setOperation] = useState('verify'); // 'verify' | 'reuse' | 'access'
  
  const client = useMemo(
    () => new NeusClient({ apiUrl, appId, sponsorGrant, paymentSignature, extraHeaders }),
    [apiUrl, appId, sponsorGrant, paymentSignature, extraHeaders]
  );

  // Support multi-verifier requests
  const verifierList = useMemo(() => {
    return Array.isArray(requiredVerifiers) && requiredVerifiers.length > 0 
      ? requiredVerifiers 
      : ['ownership-basic'];
  }, [requiredVerifiers]);

  const primaryVerifier = verifierList[0];
  const resolvedProofId = proofId || qHash || null;
  const hasInteractiveVerifier = useMemo(
    () => verifierList.some(verifierId => INTERACTIVE_VERIFIERS.has(verifierId)),
    [verifierList]
  );
  const resolvedHostedCheckoutUrl = useMemo(() => {
    if (typeof hostedCheckoutUrl === 'string' && hostedCheckoutUrl.trim()) {
      return hostedCheckoutUrl.trim();
    }
    if (typeof apiUrl === 'string' && apiUrl.trim()) {
      try {
        return new URL('/verify', apiUrl.trim()).toString();
      } catch (_err) {
        return DEFAULT_HOSTED_CHECKOUT_URL;
      }
    }
    return DEFAULT_HOSTED_CHECKOUT_URL;
  }, [apiUrl, hostedCheckoutUrl]);
  
  // Only check existing proofs if strategy allows reuse
  const shouldCheckExisting = checkExisting && strategy !== 'fresh';

  const inferChainFromAddress = useCallback((address) => {
    const raw = String(address || '').trim();
    if (!raw) return undefined;
    if (/^0x[a-fA-F0-9]{40}$/.test(raw)) return undefined;
    if (typeof chain === 'string' && chain.includes(':')) return chain.trim();
    return 'solana:mainnet';
  }, [chain]);

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
      const proofId = existingProof.proofId || existingProof.qHash || null;
      onVerified({
        proofId,
        qHash: proofId,
        address: existingProof.walletAddress || address,
        verifierIds: verifierList,
        verifiedVerifiers: existingProof.verifiedVerifiers || [],
        existing: true,
        proofsByVerifierId: gateResult.existing || {},
        statusUrl: proofId
          ? `${apiUrl || 'https://api.neus.network'}/api/v1/verification/status/${proofId}`
          : null
      });
    }

    return true;
  }, [apiUrl, onVerified, primaryVerifier, verifierList]);

  const getOrRequestWalletAddress = useCallback(async () => {
    const provider =
      wallet ||
      (typeof window !== 'undefined' ? window.ethereum : null);
    if (!provider) {
      throw new Error('No wallet provider available');
    }

    // Solana / generic non-EVM provider paths.
    if (provider.publicKey && typeof provider.publicKey.toBase58 === 'function') {
      const pk = provider.publicKey.toBase58();
      if (pk) return pk;
    }
    if (typeof provider.getAddress === 'function') {
      const addr = await provider.getAddress().catch(() => null);
      if (addr) return addr;
    }
    if (typeof provider.address === 'string' && provider.address) {
      return provider.address;
    }
    if (typeof provider.request !== 'function') {
      throw new Error('No wallet provider available');
    }

    // Prefer existing connection without prompting.
    let accounts = await provider.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      await provider.request({ method: 'eth_requestAccounts' });
      accounts = await provider.request({ method: 'eth_accounts' });
    }
    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet accounts available');
    }
    return accounts[0];
  }, [wallet]);

  const tryPrivateReuse = useCallback(async (address) => {
    // Owner-signed private reuse: use minimal gate checks (no private proof payload download).
    setOperation('reuse');
    setState('signing');

    const provider = wallet || (typeof window !== 'undefined' ? window.ethereum : null);
    const requirements = buildGateRequirements();
    const resolvedChain = inferChainFromAddress(address);
    const resolvedSignatureMethod =
      (typeof signatureMethod === 'string' && signatureMethod.trim())
        ? signatureMethod.trim()
        : ((resolvedChain && !resolvedChain.startsWith('eip155:')) ? 'ed25519' : undefined);
    const privateAuth = provider
      ? await client.createGatePrivateAuth({
          address,
          wallet: provider,
          ...(resolvedChain ? { chain: resolvedChain } : {}),
          ...(resolvedSignatureMethod ? { signatureMethod: resolvedSignatureMethod } : {})
        })
      : null;

    const gateResults = await Promise.all(
      requirements.map(async (requirement) => {
        const verifierId = requirement?.verifierId;
        if (!verifierId) {
          return { verifierId: null, eligible: false, qHash: null };
        }

        const maxAgeMs = requirement?.maxAgeMs;
        const gateParams = {
          address,
          verifierIds: [verifierId],
          includePrivate: true,
          includeQHashes: true,
          ...(privateAuth ? { privateAuth } : { wallet: provider }),
          ...(resolvedChain ? { chain: resolvedChain } : {}),
          ...(resolvedSignatureMethod ? { signatureMethod: resolvedSignatureMethod } : {})
        };
        if (typeof maxAgeMs === 'number' && maxAgeMs > 0) {
          gateParams.since = Date.now() - maxAgeMs;
        }

        const apiResult = await client.gateCheck(gateParams);
        const data = apiResult?.data || {};
        const matchedQHashes = Array.isArray(data.matchedQHashes)
          ? data.matchedQHashes
          : (Array.isArray(data.matchedProofIds) ? data.matchedProofIds : []);

        return {
          verifierId,
          eligible: data.eligible === true,
          qHash: matchedQHashes[0] || null
        };
      })
    );

    const existing = {};
    const missing = [];
    for (const result of gateResults) {
      if (!result.verifierId) continue;
      if (!result.eligible) {
        missing.push({ verifierId: result.verifierId });
        continue;
      }
      if (result.qHash) {
        existing[result.verifierId] = {
          proofId: result.qHash,
          qHash: result.qHash,
          walletAddress: address,
          verifiedVerifiers: [{ verifierId: result.verifierId, verified: true }]
        };
      }
    }

    const adaptedGateResult = {
      satisfied: missing.length === 0,
      missing,
      existing,
      allProofs: []
    };

    setExistingProofs(adaptedGateResult);
    return adaptedGateResult;
  }, [client, buildGateRequirements, wallet, inferChainFromAddress, signatureMethod]);

  const launchHostedCheckout = useCallback(async () => {
    if (typeof window === 'undefined') {
      throw new Error('Hosted checkout is only available in browser environments');
    }

    const origin = window.location.origin;
    const returnUrl = window.location.href;
    const checkoutUrl = new URL(resolvedHostedCheckoutUrl);
    checkoutUrl.searchParams.set('verifiers', verifierList.join(','));
    checkoutUrl.searchParams.set('mode', 'popup');
    checkoutUrl.searchParams.set('returnUrl', returnUrl);
    checkoutUrl.searchParams.set('origin', origin);

    let expectedOrigin = '*';
    try {
      expectedOrigin = new URL(resolvedHostedCheckoutUrl).origin;
    } catch (_err) {
      expectedOrigin = '*';
    }

    return await new Promise((resolve, reject) => {
      const popup = window.open(
        checkoutUrl.toString(),
        'neus_checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      let completed = false;
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Hosted checkout timed out. Please try again.'));
      }, 10 * 60 * 1000);

      const pollId = window.setInterval(() => {
        if (!popup.closed) return;
        if (!completed) {
          cleanup();
          reject(new Error('Hosted checkout was closed before completion.'));
        }
      }, 500);

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        window.clearTimeout(timeoutId);
        window.clearInterval(pollId);
        try {
          if (!popup.closed) popup.close();
        } catch (_err) {
          // Ignore cross-origin popup close issues
        }
      };

      const onMessage = (event) => {
        if (expectedOrigin !== '*' && event.origin !== expectedOrigin) return;
        const payload = event?.data;
        if (!payload || payload.type !== HOSTED_CHECKOUT_MESSAGE_TYPE) return;

        completed = true;
        cleanup();

        if (payload?.eligible === false) {
          reject(new Error('Hosted checkout completed but eligibility was not satisfied.'));
          return;
        }

        resolve(payload);
      };

      window.addEventListener('message', onMessage);
    });
  }, [resolvedHostedCheckoutUrl, verifierList]);

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
        const provider =
          wallet ||
          (typeof window !== 'undefined' ? window.ethereum : null);
        if (!provider || typeof provider.request !== 'function') return;

        const accounts = await provider.request({ method: 'eth_accounts' });
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
    const provider =
      wallet ||
      (typeof window !== 'undefined' ? window.ethereum : null);
    if (provider && typeof provider.on === 'function' && typeof provider.removeListener === 'function') {
      const handleAccountsChanged = () => {
        setWalletAddress(null);
        setExistingProofs(null);
        if (state === 'verified') setState('idle');
        checkExistingProofs();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      return () => provider.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [shouldCheckExisting, mode, client, buildGateRequirements, applySatisfiedGateResult, state, wallet]);

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
        if (!resolvedProofId) {
          throw new Error('proofId is required for access mode');
        }
        
        setState('verifying');
        
        // Use SDK's private access method with wallet signature
        const privateData = await client.getPrivateStatus(
          resolvedProofId,
          wallet || (typeof window !== 'undefined' ? window.ethereum : null)
        );
        
        setState('verified');
        
        onVerified?.({
          proofId: resolvedProofId,
          qHash: resolvedProofId,
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
        if (hasInteractiveVerifier) {
          setOperation('verify');
          setIsProcessing(true);
          setState('zkpassport-launch');

          const checkoutResult = await launchHostedCheckout();
          const checkoutProofId = checkoutResult?.proofId || checkoutResult?.qHash || null;

          setState('verified');
          onVerified?.({
            proofId: checkoutProofId,
            qHash: checkoutProofId,
            verifierIds: verifierList,
            existing: false,
            mode: 'create',
            eligible: checkoutResult?.eligible !== false,
            statusUrl: checkoutResult?.statusUrl || (
              checkoutProofId
                ? `${apiUrl || 'https://api.neus.network'}/api/v1/verification/status/${checkoutProofId}`
                : null
            )
          });
          return;
        }

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
            throw new Error(`${verifierId} cannot be created via the wallet flow. It requires hosted checkout or a server integration.`);
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
          if (verifierId === 'wallet-link') {
            if (
              !explicit?.secondaryWalletAddress ||
              !explicit?.signature ||
              !explicit?.chain ||
              !explicit?.signatureMethod
            ) {
              throw new Error(
                'wallet-link requires verifierData: { secondaryWalletAddress, signature, chain, signatureMethod }'
              );
            }
            return explicit;
          }

          throw new Error(`${verifierId} requires explicit verifierData`);
        };

        const verifyOne = async (verifierId) => {
          const dataForVerifier = buildDataForVerifier(verifierId);
          const params =
            verifierId === 'ownership-basic' && dataForVerifier === null
              ? {
                  verifier: 'ownership-basic',
                  content:
                    (typeof verifierData?.['ownership-basic'] === 'string'
                      ? verifierData['ownership-basic']
                      : verifierData?.['ownership-basic']?.content) || `NEUS verification (${verifierId})`,
                  options: resolvedProofOptions
                }
              : {
                  verifier: verifierId,
                  data: dataForVerifier,
                  options: resolvedProofOptions
                };

          setState('signing');
          const created = await client.verify({
            ...params,
            wallet: wallet || (typeof window !== 'undefined' ? window.ethereum : undefined)
          });
          setState('verifying');
          const proofIdToCheck = created.proofId || created.qHash || created?.data?.proofId || created?.data?.qHash;
          const final = await client.pollProofStatus(proofIdToCheck, { interval: 3000, timeout: 60000 });

          const verifiedVerifiers = final?.data?.verifiedVerifiers || [];
          const verifierResult = verifiedVerifiers.find(v => v.verifierId === verifierId);
          if (!verifierResult || verifierResult.verified !== true) {
            throw new Error(`Verification failed for ${verifierId}`);
          }

          const hubTx = final?.data?.hubTransaction || {};
          const crosschain = final?.data?.crosschain || {};
          const txHash = hubTx?.txHash || crosschain?.hubTxHash || null;

          const finalProofId = final?.proofId || final?.qHash || proofIdToCheck;
          return {
            verifierId,
            proofId: finalProofId,
            qHash: finalProofId,
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
        const lastProofId = last?.proofId || last?.qHash || null;
        onVerified?.({
          proofId: lastProofId,
          qHash: lastProofId,
          proofIds: results.map(r => r.proofId || r.qHash).filter(Boolean),
          qHashes: results.map(r => r.proofId || r.qHash).filter(Boolean),
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
    resolvedProofId,
    verifierList,
    hasInteractiveVerifier,
    client,
    apiUrl,
    verifierOptions,
    verifierData,
    proofOptions,
    launchHostedCheckout,
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
    state,
    wallet
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
