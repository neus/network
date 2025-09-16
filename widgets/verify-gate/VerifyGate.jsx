"use client";
/**
 * NEUS VerifyGate Widget
 * React component for gated content verification
 * @license Apache-2.0
 */
import React, { useCallback, useMemo, useState } from 'react';
import { NeusClient } from '@neus/sdk';

// Brand image served from IPFS with gateway failover
const BRAND_CID = 'bafkreiefbrffecrifnzcn3hfksklw3vospkf244c5ijkizxtzbsm2vtnga';
const BRAND_IPFS_GATEWAYS = [
  'https://ipfs.neus.network/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/'
];

const NeusLogo = ({ size = 14 }) => {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const src = `${BRAND_IPFS_GATEWAYS[gatewayIndex]}${BRAND_CID}`;
  return (
    <img
      src={src}
      alt="NEUS"
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setGatewayIndex((i) => (i + 1) % BRAND_IPFS_GATEWAYS.length)}
      style={{ height: size, width: size, marginRight: 8, verticalAlign: 'middle' }}
    />
  );
};

export function VerifyGate({
  requiredVerifiers = ['ownership-basic'], // Array of verifier IDs
  onVerified,
  apiUrl,
  style,
  children,
  // Advanced options for power users
  verifierOptions,
  verifierData,
  showBrand = true,
  disabled = false,
  // Private proof access mode
  mode = 'create', // 'create' or 'access'
  qHash = null // Required when mode='access'
}) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const client = useMemo(() => new NeusClient({ apiUrl }), [apiUrl]);

  // Support multi-verifier requests
  const verifierList = useMemo(() => {
    return Array.isArray(requiredVerifiers) && requiredVerifiers.length > 0 
      ? requiredVerifiers 
      : ['ownership-basic'];
  }, [requiredVerifiers]);

  const primaryVerifier = verifierList[0];

  const handleClick = useCallback(async () => {
    if (disabled || isProcessing) return;
    
    setError(null);
    setIsProcessing(true);
    setState('signing');

    try {
      if (mode === 'access') {
        // Private proof access mode - requires wallet signature
        if (!qHash) {
          throw new Error('qHash is required for access mode');
        }
        
        setState('verifying');
        
        // Use SDK's private access method with wallet signature
        const privateData = await client.getPrivateStatus(qHash);
        
        setState('verified');
        
        // Callback with private data
        onVerified?.({
          qHash,
          data: privateData.data,
          mode: 'access',
          statusUrl: privateData.statusUrl
        });
        
      } else {
        // Original verification creation mode
        setState('verifying');
        
        // Handle multi-verifier requests
        let verificationData;
        if (verifierList.length === 1) {
          // Single verifier - prefer explicit verifierData override, else simple defaults
          const explicit = verifierData && verifierData[primaryVerifier];
          if (explicit && typeof explicit === 'object') {
            verificationData = explicit;
          } else if (primaryVerifier === 'ownership-basic') {
            verificationData = { content: `NEUS verification with ${primaryVerifier}` };
          } else {
            verificationData = verifierOptions || {};
          }
        } else {
          // Multi-verifier - namespaced data structure
          verificationData = {};
          verifierList.forEach(verifierId => {
            const explicit = verifierData && verifierData[verifierId];
            if (explicit && typeof explicit === 'object') {
              verificationData[verifierId] = explicit;
            } else if (verifierId === 'ownership-basic') {
              verificationData[verifierId] = { content: `NEUS verification with ${verifierId}` };
            } else {
              // Fallback to shared verifierOptions object if provided
              verificationData[verifierId] = verifierOptions || {};
            }
          });
        }
        
        const res = await client.verify({
          verifierIds: verifierList,
          data: verificationData,
          options: {
            privacyLevel: 'private', // Secure by default
            publicDisplay: false,
            storeOriginalContent: false,
            ...(verifierOptions && { verifierOptions })
          }
        });

        // Poll for completion  
        const final = await client.pollProofStatus(res.qHash || res?.data?.qHash, { 
          interval: 3000, 
          timeout: 60000 
        });

        setState('verified');
        
        // Extract transaction hash for callback
        const hubTx = final?.data?.hubTransaction || {};
        const crosschain = final?.data?.crosschain || {};
        const txHash = hubTx?.txHash || crosschain?.hubTxHash || null;
        
        // Check if all required verifiers passed
        const verifiedVerifiers = final?.data?.verifiedVerifiers || [];
        const allVerified = verifierList.every(verifierId => 
          verifiedVerifiers.find(v => v.verifierId === verifierId)?.verified === true
        );

        if (allVerified) {
          onVerified?.({
            qHash: final.qHash,
            address: final?.data?.walletAddress,
            txHash,
            verifierIds: verifierList,
            verifiedVerifiers,
            statusUrl: final?.statusUrl
          });
        } else {
          throw new Error('Not all required verifiers passed');
        }
      }

    } catch (error) {
      setError(error?.message || (mode === 'access' ? 'Access failed' : 'Verification failed'));
      setState('error');
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, mode, qHash, verifierList, client, verifierOptions, verifierData, onVerified, primaryVerifier]);

  // Widget state labels
  const labels = mode === 'access' ? {
    idle: 'Sign to view',
    signing: 'Waiting for signature...',
    verifying: 'Accessing...',
    verified: 'Access granted ✓',
    error: 'Retry'
  } : {
    idle: 'Verify with NEUS',
    signing: 'Waiting for signature...',
    verifying: 'Verifying...',
    verified: 'Verified ✓',
    error: 'Retry'
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
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            background: state === 'verified' ? '#4caf50' : '#fff',
            color: state === 'verified' ? '#fff' : '#333',
            cursor: disabled || isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {showBrand && <NeusLogo size={14} />}
          <span>{labels[state]}</span>
        </button>
        {error && (
          <div style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
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
      style={style} 
      disabled={disabled || isProcessing}
    >
      {showBrand && <NeusLogo size={14} />}
      <span>{labels[state]}</span>
      {error && ` — ${error}`}
    </button>
  );
}
