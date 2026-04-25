import React from 'react';

export function CodePreview({ claim, appId }) {
  if (!claim) return null;

  const vd = JSON.stringify(claim.verifierData);
  const snippet = `import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  appId="${appId || 'your-app'}"
  requiredVerifiers={['${claim.verifierId}']}
  verifierData={{
    '${claim.verifierId}': ${vd}
  }}
  checkExisting
  allowPrivateReuse
  strategy="reuse-or-create"
  buttonText="Issue receipt"
/>`;

  return (
    <div className="space-y-2">
      <p className="m-0 text-[0.8rem] text-text-m">Drop-in pattern: check requirements, then create or host issue flow</p>
      <pre className="pre-code max-h-[20rem] text-left" tabIndex={0}>
{snippet}
      </pre>
    </div>
  );
}
