#!/usr/bin/env node
/**
 * NEUS Network - Basic Node.js Example
 * Direct verification with standard message signing
 */

import { ethers } from 'ethers';
import { NeusClient } from '../../sdk/client.js';

const API_BASE = 'https://api.neus.network';
const WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY;

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
  
  // Ask the API for the exact signing string, then sign it
  console.log('Standardizing and signing message...');
  const standardizeRes = await fetch(`${API_BASE}/api/v1/verification/standardize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      verifierIds: ['ownership-basic'],
      data: verificationData,
      signedTimestamp
    })
  });
  if (!standardizeRes.ok) {
    throw new Error(`Standardize failed (${standardizeRes.status})`);
  }
  const standardized = await standardizeRes.json();
  const message = standardized?.data?.signerString;
  if (typeof message !== 'string' || !message.length) {
    throw new Error('Missing signerString in standardize response');
  }

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

  const proofId = result.data?.proofId;
  console.log('Proof ID:', proofId);
  if (!proofId) {
    throw new Error('Missing proofId in verification response');
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
