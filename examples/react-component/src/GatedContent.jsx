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
      <div className="neus-sdk-gated">
        <h2>Exclusive content</h2>
        <p>Visible when the gate passes.</p>
      </div>
    </VerifyGate>
  );
}
