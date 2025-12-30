'use client';
import { VerifyGate } from '@neus/sdk/widgets';

/**
 * Minimal VerifyGate example.
 * Replace the NFT contract and tokenId with your own.
 */
export default function GatedContent() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1
        }
      }}
    >
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Exclusive Content</h2>
        <p>Only visible to NFT holders.</p>
      </div>
    </VerifyGate>
  );
}
