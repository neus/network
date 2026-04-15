import { VerifyGate } from '@neus/sdk/widgets';

export default function GatedContent() {
  const appId = import.meta.env.VITE_NEUS_APP_ID;

  return (
    <VerifyGate
      appId={appId}
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1,
        },
      }}
    >
      <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Exclusive content</h2>
        <p style={{ marginBottom: 0 }}>Visible when the gate passes.</p>
      </div>
    </VerifyGate>
  );
}
