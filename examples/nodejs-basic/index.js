#!/usr/bin/env node
/**
 * NEUS Network - Basic Node.js Example
 * Direct verification with standard message signing
 */

import { ethers } from 'ethers';
import { NeusClient } from '../../sdk/client.js';
import { constructVerificationMessage } from '../../sdk/utils.js';

const API_BASE = process.env.NEUS_API_URL || 'https://api.neus.network';
const WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY;
const HUB_CHAIN_ID = 84532; // NEUS Hub

if (!WALLET_PRIVATE_KEY) {
  console.error('Set TEST_WALLET_PRIVATE_KEY environment variable');
  process.exit(1);
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
  const message = constructVerificationMessage({
    walletAddress,
    data: verificationData,
    signedTimestamp,
    verifierIds: ['ownership-basic'],
    chainId: HUB_CHAIN_ID
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
      chainId: HUB_CHAIN_ID,
      signature
    })
  });

  const raw = await verifyResponse.text();
  let result;
  try {
    result = raw ? JSON.parse(raw) : null;
  } catch {
    result = null;
  }

  if (!verifyResponse.ok) {
    const msg = (result && (result.error?.message || result.error || result.message)) || raw || verifyResponse.statusText;
    throw new Error(`Verification failed (${verifyResponse.status}): ${msg}`);
  }

  const proofId = result.data?.qHash;
  console.log('Proof ID (qHash):', proofId);
  if (!proofId) {
    throw new Error('Missing Proof ID (qHash) in verification response');
  }
  
  // Poll status
  console.log('Polling status...');
  const client = new NeusClient({ apiUrl: API_BASE });
  const final = await client.pollProofStatus(proofId, {
    interval: 3000,
    timeout: 120000,
    onProgress: (s) => {
      const st = s?.status || s?.data?.status;
      if (st) console.log('Status:', st);
    }
  });
  console.log('Final Status:', final?.status || final?.data?.status);
}

main().catch(console.error);
