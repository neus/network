export const FILTER_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Access', label: 'Access' },
  { id: 'Rewards', label: 'Rewards' },
  { id: 'Agents', label: 'Agents' },
  { id: 'Bounties', label: 'Bounties' },
  { id: 'Programs', label: 'Programs' },
  { id: 'Communities', label: 'Communities' },
  { id: 'Tools', label: 'Tools' }
];

export const claims = [
  {
    id: 'campaign-supporter',
    group: 'ownership',
    uiCategory: 'Programs',
    title: 'Content owner attribution',
    example: 'Prove who controls a piece of content and unlock owner-only benefits.',
    whyItMatters: 'Prove who controls a piece of content without exposing unnecessary account data.',
    requires: 'Signed ownership statement',
    unlocks: 'Owner perks + public listing',
    cardRequires: 'Signed attestation',
    cardUnlocks: 'Owner perks',
    requirementLabel: 'Signed ownership statement',
    verifierName: 'Content ownership',
    verifierId: 'ownership-basic',
    verifierData: {
      content:
        'I own content or reference data related to the Q2 2025 community fund. This portable signed statement is for campaign perks and may appear on the public owner wall.'
    },
    seedDemoProofId: 'qhash:demo:content-owner',
    demoHighlight: true,
    receiptDetail: {
      subject: 'Maya Chen',
      claimLine: 'Content owner',
      status: 'Active',
      privacy: 'Private by default',
      worksAcross: 'Web, API, and agent runtimes'
    }
  },
  {
    id: 'fair-airdrop',
    group: 'identity',
    uiCategory: 'Rewards',
    title: 'Fair airdrop',
    example: 'Send rewards to real people without exposing private identity data.',
    whyItMatters: 'Route rewards to real people with a portable trust signal instead of a brittle “trust score” proxy.',
    requires: 'Proof of human',
    unlocks: 'Reward eligibility + creator badge',
    cardRequires: 'Proof of human',
    cardUnlocks: 'Reward eligibility',
    requirementLabel: 'Proof of human',
    verifierName: 'Proof of human (ZKPassport)',
    verifierId: 'proof-of-human',
    verifierData: { provider: 'zkpassport', scope: 'fair-drop' }
  },
  {
    id: 'creator-badge',
    group: 'ownership',
    uiCategory: 'Programs',
    title: 'Creator badge',
    example: 'Link a creator profile to accounts people can trust.',
    whyItMatters: 'Tie a public creator identity to a bound account and linked profiles without oversharing raw credentials.',
    requires: 'Linked social account',
    unlocks: 'Creator badge + business listing',
    cardRequires: 'Linked social',
    cardUnlocks: 'Creator badge',
    requirementLabel: 'Linked social account',
    verifierName: 'Social account link',
    verifierId: 'ownership-social',
    verifierData: { provider: 'x' }
  },
  {
    id: 'domain-listing',
    group: 'ownership',
    uiCategory: 'Tools',
    title: 'Business listing',
    example: 'Claim and manage a trusted business listing through domain control.',
    whyItMatters: 'Prove you control a domain to earn a directory row people can treat as real.',
    requires: 'Domain control',
    unlocks: 'Business listing + insider program',
    cardRequires: 'Domain control',
    cardUnlocks: 'Business listing',
    requirementLabel: 'DNS text record',
    verifierName: 'Domain ownership (DNS)',
    verifierId: 'ownership-dns-txt',
    verifierData: { domain: 'example.com' }
  },
  {
    id: 'insider-program',
    group: 'access',
    uiCategory: 'Access',
    title: 'Insider program',
    example: 'Unlock private offers for trusted members without another sign-up flow.',
    whyItMatters: 'Gate offers to humans you can recognize across sessions, without a separate KYC path.',
    requires: 'Proof of human',
    unlocks: 'Member offer + team resource',
    cardRequires: 'Proof of human',
    cardUnlocks: 'Member offer',
    requirementLabel: 'Proof of human',
    verifierName: 'Proof of human (ZKPassport)',
    verifierId: 'proof-of-human',
    verifierData: { provider: 'zkpassport', scope: 'insider' }
  },
  {
    id: 'team-resource',
    group: 'identity',
    uiCategory: 'Access',
    title: 'Team resource',
    example: 'Give verified team members access to private resources.',
    whyItMatters: 'Open org-locked content only for accounts your IdP and NEUS can align on a member or controller identity.',
    requires: 'Org account',
    unlocks: 'Team access + member perk',
    cardRequires: 'Org account',
    cardUnlocks: 'Team access',
    requirementLabel: 'Org account',
    verifierName: 'Workplace sign-in',
    verifierId: 'ownership-org-oauth',
    verifierData: { expectedOrgDomain: 'example.com', provider: 'google' }
  },
  {
    id: 'member-perk',
    group: 'access',
    uiCategory: 'Communities',
    title: 'Member perk',
    example: 'Unlock perks for members who meet token or contribution requirements.',
    whyItMatters: 'Tie community benefits to on-chain participation without hand-entered balances in your app.',
    requires: 'Token threshold',
    unlocks: 'Member perk + collector access',
    cardRequires: 'Token threshold',
    cardUnlocks: 'Member perks',
    requirementLabel: 'Token balance threshold',
    verifierName: 'Token holding',
    verifierId: 'token-holding',
    verifierData: {
      contractAddress: '0x0000000000000000000000000000000000000000',
      minBalance: '100',
      chainId: 8453
    }
  },
  {
    id: 'collector',
    group: 'access',
    uiCategory: 'Access',
    title: 'Collector access',
    example: 'Turn verified ownership into access to collector-only experiences.',
    whyItMatters: 'Use a portable proof of a specific asset instead of a bespoke holder check in every surface.',
    requires: 'NFT ownership',
    unlocks: 'Collector access + project admin',
    cardRequires: 'NFT ownership',
    cardUnlocks: 'Collector access',
    requirementLabel: 'Holds a specific NFT',
    verifierName: 'NFT ownership',
    verifierId: 'nft-ownership',
    verifierData: {
      contractAddress: '0x0000000000000000000000000000000000000000',
      tokenId: '1',
      chainId: 8453
    }
  },
  {
    id: 'project-admin',
    group: 'ownership',
    uiCategory: 'Programs',
    title: 'Project admin',
    example: 'Protect admin actions with receipts tied to contract authority.',
    whyItMatters: 'Restrict sensitive paths to contract roles you can re-check on demand without sharing keys.',
    requires: 'Contract control',
    unlocks: 'Admin permissions + tooling',
    cardRequires: 'Contract control',
    cardUnlocks: 'Admin permissions',
    requirementLabel: 'On-chain admin role',
    verifierName: 'Contract control',
    verifierId: 'contract-ownership',
    verifierData: {
      contractAddress: '0x0000000000000000000000000000000000000000',
      chainId: 8453,
      method: 'owner'
    }
  },
  {
    id: 'safe-payout',
    group: 'risk',
    uiCategory: 'Bounties',
    title: 'Safe payout',
    example: 'Move funds with a clear risk read before a payout or transfer.',
    whyItMatters: 'Combine a transfer risk read with a receipt so your treasury path stays explainable to ops.',
    requires: 'Transfer risk check',
    unlocks: 'Payout or transfer path',
    cardRequires: 'Transfer risk',
    cardUnlocks: 'Payout path',
    requirementLabel: 'Address and transfer risk check',
    verifierName: 'Payout and transfer risk',
    verifierId: 'wallet-risk',
    verifierData: { chainId: 8453, walletAddress: '0x0000000000000000000000000000000000000000' }
  },
  {
    id: 'publish',
    group: 'risk',
    uiCategory: 'Tools',
    title: 'Publish approval',
    example: 'Take moderated content live with a receipt you can show ops and users.',
    whyItMatters: 'Attach a moderation result to a publish step without building a custom audit log.',
    requires: 'Content moderation',
    unlocks: 'Go-live for approved content',
    cardRequires: 'Content moderation',
    cardUnlocks: 'Go-live',
    requirementLabel: 'Automated content review',
    verifierName: 'Content moderation (AI)',
    verifierId: 'ai-content-moderation',
    verifierData: { content: 'Example post', contentType: 'text/plain' }
  },
  {
    id: 'agent-listing',
    group: 'agents',
    uiCategory: 'Agents',
    title: 'Agent listing',
    example: 'List a trusted agent after you bind a controller to this identity.',
    whyItMatters: 'Let users discover agents you have attested, with scope they can reason about up front.',
    requires: 'Agent identity',
    unlocks: 'Directory + discovery',
    cardRequires: 'Agent identity',
    cardUnlocks: 'Directory entry',
    requirementLabel: 'Controller-bound agent',
    verifierName: 'Agent identity',
    verifierId: 'agent-identity',
    verifierData: {
      agentId: 'research-agent',
      agentWallet: '0x0000000000000000000000000000000000000000',
      agentChainRef: 'eip155:8453',
      agentType: 'ai',
      agentLabel: 'Example agent'
    }
  },
  {
    id: 'agent-action',
    group: 'agents',
    uiCategory: 'Agents',
    title: 'Agent action',
    example: 'Let an agent act with scoped, expiring permissions you can revoke.',
    whyItMatters: 'Use delegation with limits instead of a single long-lived key for every automation.',
    requires: 'Signed delegation',
    unlocks: 'Allowed actions in scope',
    cardRequires: 'Signed delegation',
    cardUnlocks: 'Scoped actions',
    requirementLabel: 'Scoped delegation',
    verifierName: 'Agent delegation',
    verifierId: 'agent-delegation',
    verifierData: {
      controllerWallet: '0x0000000000000000000000000000000000000000',
      controllerChainRef: 'eip155:8453',
      agentWallet: '0x0000000000000000000000000000000000000000',
      agentChainRef: 'eip155:8453',
      scope: 'showcase:claim',
      permissions: ['read', 'execute'],
      maxSpend: '0',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    }
  }
];

export function getInitialDemoProofs() {
  const s = {};
  for (const row of claims) {
    if (row.seedDemoProofId) s[row.id] = { proofId: row.seedDemoProofId };
  }
  return s;
}

export function getReceiptLineDetails(claim) {
  if (claim.receiptDetail) return claim.receiptDetail;
  return {
    subject: 'Verified holder',
    claimLine: claim.title,
    status: 'Active',
    privacy: 'Private by default',
    worksAcross: 'Web, API, and agent runtimes'
  };
}

export function claimById(id) {
  return claims.find((c) => c.id === id) || null;
}

export function filterClaims(claimsList, filterId) {
  if (filterId === 'all' || !filterId) return claimsList;
  return claimsList.filter((c) => c.group === filterId);
}

export function filterByUiCategory(claimsList, cat) {
  if (cat === 'all' || cat === 'All') return claimsList;
  return claimsList.filter((c) => c.uiCategory === cat);
}
