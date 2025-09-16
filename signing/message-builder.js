/**
 * NEUS Message Builder - Minimal signing utility
 * Use only when you need to build the standard message format manually
 */

/**
 * Build NEUS standard signing message
 * @param {Object} params - Message parameters
 * @returns {string} Standard 6-line message to sign
 */
export function buildNeusMessage({ walletAddress, verifierIds, data, signedTimestamp, chainId = 84532 }) {
  // Validate inputs
  if (!walletAddress || !Array.isArray(verifierIds) || !data || !signedTimestamp) {
    throw new Error('Missing required parameters');
  }
  
  // Normalize components
  const normalizedAddress = walletAddress.toLowerCase();
  const verifiersString = verifierIds.join(',');
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  
  // Build standard 6-line message
  return [
    'NEUS Verification Request',
    `Wallet: ${normalizedAddress}`,
    `Chain: ${chainId}`,
    `Verifiers: ${verifiersString}`,
    `Data: ${dataString}`,
    `Timestamp: ${signedTimestamp}`
  ].join('\n');
}

/**
 * Example usage for any JavaScript environment
 */
export function createVerificationRequest({ walletAddress, verifierIds, data }) {
  const signedTimestamp = Date.now();
  
  const message = buildNeusMessage({
    walletAddress,
    verifierIds,
    data,
    signedTimestamp,
    chainId: 84532
  });
  
  return {
    message,
    request: {
      walletAddress,
      verifierIds,
      data,
      signedTimestamp,
      chainId: 84532
    }
  };
}

// Example for Node.js environment
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('message-builder.js')) {
  console.log('NEUS Message Builder Example\n');
  
  const example = createVerificationRequest({
    walletAddress: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
    verifierIds: ['ownership-basic'],
    data: { content: 'Hello NEUS Network' }
  });
  
  console.log('Message to sign:');
  console.log('---');
  console.log(example.message);
  console.log('---');
  
  console.log('\nRequest payload:');
  console.log(JSON.stringify(example.request, null, 2));
}
