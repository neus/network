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
  console.log('NEUS Network - Basic Example\n');
  
  const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY);
  const walletAddress = wallet.address;
  const signedTimestamp = Date.now();
  
  console.log('Wallet:', walletAddress);
  console.log('API:', API_BASE, '\n');
  
  const verificationData = {
    content: 'Hello NEUS Network',
    owner: walletAddress
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
  const qHash = result.data?.qHash;
  console.log('Proof created:', qHash);
  
  // Check status
  console.log('Checking status...');
  const statusResponse = await fetch(`${API_BASE}/api/v1/verification/status/${qHash}`);
  const status = await statusResponse.json();
  
  console.log('Success:', status.success);
  console.log('Status:', status.data?.status);
}

main().catch(console.error);