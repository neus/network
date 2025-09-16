#!/usr/bin/env node
/**
 * NEUS Network - Safe/Contract Wallet Example
 * Direct verification with Safe wallet signatures (EIP-1271/6492)
 */

const API_BASE = process.env.NEUS_API_URL || 'https://api.neus.network';
const SAFE_WALLET_ADDRESS = process.env.SAFE_WALLET_ADDRESS;
const SAFE_SIGNATURE = process.env.SAFE_SIGNATURE;

if (!SAFE_WALLET_ADDRESS) {
  console.error('Set SAFE_WALLET_ADDRESS environment variable');
  process.exit(1);
}

// Build NEUS standard signing message
function buildSigningMessage({ walletAddress, verifierIds, data, signedTimestamp, chainId = 84532 }) {
  const normalizedAddress = walletAddress.toLowerCase();
  const verifiersString = verifierIds.join(',');
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  
  return [
    'NEUS Verification Request',
    `Wallet: ${normalizedAddress}`,
    `Chain: ${chainId}`,
    `Verifiers: ${verifiersString}`,
    `Data: ${dataString}`,
    `Timestamp: ${signedTimestamp}`
  ].join('\n');
}

async function main() {
  console.log('NEUS Network - Safe Wallet Example\n');
  console.log('Safe Address:', SAFE_WALLET_ADDRESS);
  
  const signedTimestamp = Date.now();
  const verificationData = {
    content: 'Safe wallet verification',
    owner: SAFE_WALLET_ADDRESS
  };
  
  // Build the standard message
  const message = buildSigningMessage({
    walletAddress: SAFE_WALLET_ADDRESS,
    verifierIds: ['ownership-basic'],
    data: verificationData,
    signedTimestamp,
    chainId: 84532
  });
  
  console.log('Message to sign with Safe:', message);
  
  if (!SAFE_SIGNATURE) {
    console.log('\nTo complete this example:');
    console.log('1. Sign the message above with Safe');
    console.log('2. Set SAFE_SIGNATURE variable');
    console.log('3. Re-run this script');
    return;
  }
  
  // Submit verification with Safe signature
  console.log('Submitting verification with Safe signature...');
  const verifyResponse = await fetch(`${API_BASE}/api/v1/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: SAFE_WALLET_ADDRESS,
      verifierIds: ['ownership-basic'],
      data: verificationData,
      signedTimestamp,
      chainId: 84532,
      signature: SAFE_SIGNATURE
    })
  });
  
  const result = await verifyResponse.json();
  
  if (result.success) {
    console.log('Safe verification successful:', result.data?.qHash);
  } else {
    console.error('Safe verification failed:', result.error?.message);
  }
}

main().catch(console.error);
