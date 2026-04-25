export function buildClaimRow(claim, { proofId = null } = {}) {
  const verified = Boolean(proofId && String(proofId).length > 0);
  const requirements = [
    {
      id: `req-${claim.id}`,
      label: claim.requirementLabel,
      verifierName: claim.verifierName,
      satisfied: verified
    }
  ];

  let readinessState;
  if (claim.readinessLocked) {
    readinessState = 'Unavailable';
  } else if (verified) {
    readinessState = 'Receipt active';
  } else if (claim.trustStatusWhenPending === 'expired') {
    readinessState = 'Expired';
  } else if (claim.trustStatusWhenPending === 'revoked') {
    readinessState = 'Revoked';
  } else {
    readinessState = 'Needs receipt';
  }

  return {
    claim,
    requirements,
    readinessState,
    isReady: verified,
    isLocked: claim.readinessLocked === true,
    explanation: claim.example
  };
}

export function filterByQuery(list, q) {
  const t = (q || '').trim().toLowerCase();
  if (!t) return list;
  return list.filter(
    (c) =>
      c.title.toLowerCase().includes(t) ||
      c.example.toLowerCase().includes(t) ||
      (c.whyItMatters && c.whyItMatters.toLowerCase().includes(t)) ||
      c.id.toLowerCase().includes(t) ||
      c.requirementLabel.toLowerCase().includes(t) ||
      c.verifierName.toLowerCase().includes(t) ||
      c.verifierId.toLowerCase().includes(t) ||
      c.cardRequires.toLowerCase().includes(t) ||
      c.cardUnlocks.toLowerCase().includes(t)
  );
}

export function applyListScope(list, scope, proofs) {
  if (scope === 'all' || scope === 'all-opp' || !scope) return list;
  if (scope === 'ready') {
    return list.filter((c) => proofs[c.id]?.proofId);
  }
  if (scope === 'near') {
    return list.filter((c) => !proofs[c.id]?.proofId);
  }
  return list;
}

export function nextContinueTarget(visible, prefer, proofs) {
  if (prefer && visible.some((c) => c.id === prefer.id) && !proofs[prefer.id]?.proofId) {
    return prefer;
  }
  const p = visible.find((c) => !proofs[c.id]?.proofId) || null;
  return p;
}
