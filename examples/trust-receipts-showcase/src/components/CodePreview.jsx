import React from 'react';

export function CodePreview({ claim }) {
  if (!claim) return null;

  const gateId = claim.gateId || `gate_${claim.id}`;
  const snippet = `import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  gateId="${gateId}"
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
