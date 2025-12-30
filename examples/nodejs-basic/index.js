#!/usr/bin/env node
/**
 * NEUS Network - Basic Node.js Example
 * Direct verification with standard message signing
 */

import { ethers } from 'ethers';

const API_BASE = process.env.NEUS_API_URL || 'https://api.neus.network';
const WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY;

if (!WALLET_PRIVATE_KEY) {
  console.error('Set TEST_WALLET_PRIVATE_KEY environment variable');
  process.exit(1);
}

// Build NEUS standard signing message
function buildSigningMessage({ walletAddress, verifierIds, data, signedTimestamp, chainId = 84532 }) {
  const normalizedAddress = walletAddress.toLowerCase();
  const verifiersString = verifierIds.join(',');
  function deterministicStringify(obj) {
    if (obj === null) return 'null';
    if (obj === undefined) return undefined;
    const t = typeof obj;
    if (t !== 'object') return JSON.stringify(obj);
    if (obj instanceof Date || obj instanceof RegExp) return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      const els = obj.map(v => {
        const s = deterministicStringify(v);
        return s === undefined ? 'null' : s;
      });
      return '[' + els.join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const parts = [];
    for (const k of keys) {
      const vs = deterministicStringify(obj[k]);
      if (vs === undefined) continue;
      parts.push(JSON.stringify(k) + ':' + vs);
    }
    return '{' + parts.join(',') + '}';
  }
  const dataString = deterministicStringify(data);
  
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
  console.log('NEUS Network - Basic Example\n');
  
  const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY);
  const walletAddress = wallet.address;
  const signedTimestamp = Date.now();
  
  console.log('Wallet:', walletAddress);
  console.log('API:', API_BASE, '\n');
  
  const verificationData = {
    content: 'Hello NEUS Network',
    owner: walletAddress,
    reference: {
      type: 'url',
      id: 'https://example.com'
    }
  };
  
  // Build and sign the standard message
  console.log('Building and signing message...');
  const message = buildSigningMessage({
    walletAddress,
    verifierIds: ['ownership-basic'],
    data: verificationData,
    signedTimestamp,
    chainId: 84532
  });
  
  const signature = await wallet.signMessage(message);
  
  // Submit verification
  console.log('Submitting verification...');
  const verifyResponse = await fetch(`${API_BASE}/api/v1/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      verifierIds: ['ownership-basic'],
      data: verificationData,
      signedTimestamp,
      chainId: 84532,
      signature
    })
  });
  
  const result = await verifyResponse.json();
  const proofId = result.data?.qHash;
  console.log('Proof ID (qHash):', proofId);
  if (!proofId) {
    throw new Error('Missing Proof ID (qHash) in verification response');
  }
  
  // Check status
  console.log('Checking status...');
  const statusResponse = await fetch(`${API_BASE}/api/v1/verification/status/${proofId}`);
  const status = await statusResponse.json();
  
  console.log('Success:', status.success);
  console.log('Status:', status.data?.status);
}

main().catch(console.error);