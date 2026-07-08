/**
 * Runtime Mount — proof-backed agent context bundle (neus.runtime-mount.v1).
 * SSOT for CLI, integrators, and protocol neus_agent_mount response shape.
 */

export const RUNTIME_MOUNT_SCHEMA = 'neus.runtime-mount.v1';

const PROOF_URL_BASE = 'https://neus.network/proof/';

/**
 * @param {string | null | undefined} value
 */
export function normalizeWallet(value) {
  const wallet = String(value || '').trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(wallet) ? wallet : '';
}

/**
 * @param {unknown} value
 */
function asString(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : '';
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => String(item || '').trim()).filter(Boolean);
}

/**
 * @param {Record<string, unknown> | null | undefined} caps
 */
function capabilitiesToArray(caps) {
  if (Array.isArray(caps)) return asStringArray(caps);
  if (!caps || typeof caps !== 'object') return [];
  return Object.entries(caps)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => String(key).trim())
    .filter(Boolean);
}

/**
 * @param {number | null | undefined} expiresAt
 */
export function isDelegationExpired(expiresAt) {
  if (expiresAt === null || expiresAt === 0) return false;
  const ms = Number(expiresAt);
  return Number.isFinite(ms) && ms > 0 && ms <= Date.now();
}

/**
 * @param {Array<Record<string, unknown>>} identities
 * @param {{ agentId?: string, agentWallet?: string, identityQHash?: string }} selector
 */
export function pickIdentity(identities, selector) {
  const list = Array.isArray(identities) ? identities : [];
  const qHash = asString(selector.identityQHash).toLowerCase();
  if (qHash) {
    return list.find(row => asString(row.qHash).toLowerCase() === qHash) || null;
  }
  const agentId = asString(selector.agentId).toLowerCase();
  const agentWallet = normalizeWallet(selector.agentWallet);
  if (agentId) {
    const byId = list.filter(row => asString(row.agentId).toLowerCase() === agentId);
    if (agentWallet) {
      return byId.find(row => normalizeWallet(row.agentWallet) === agentWallet) || byId[0] || null;
    }
    return byId[0] || null;
  }
  if (agentWallet) {
    return list.find(row => normalizeWallet(row.agentWallet) === agentWallet) || null;
  }
  return null;
}

/**
 * @param {Array<Record<string, unknown>>} delegations
 * @param {string} controllerWallet
 * @param {string} agentWallet
 * @param {string} agentId
 */
export function pickActiveDelegation(delegations, controllerWallet, agentWallet, agentId) {
  const list = Array.isArray(delegations) ? delegations : [];
  const controller = normalizeWallet(controllerWallet);
  const agent = normalizeWallet(agentWallet);
  const id = asString(agentId).toLowerCase();
  const candidates = list.filter(row => {
    if (isDelegationExpired(row.expiresAt)) return false;
    const rowAgent = normalizeWallet(row.agentWallet);
    const rowController = normalizeWallet(row.controllerWallet);
    if (agent && rowAgent && rowAgent !== agent) return false;
    if (controller && rowController && rowController !== controller) return false;
    if (id && row.agentId && asString(row.agentId).toLowerCase() !== id) return false;
    return true;
  });
  return candidates[0] || null;
}

/**
 * @param {Record<string, unknown> | null | undefined} identity
 * @param {Record<string, unknown> | null | undefined} delegation
 */
export function resolveEffectiveRuntime(identity, delegation) {
  const delProvider = asString(delegation?.provider);
  const delModel = asString(delegation?.model);
  if (delProvider || delModel) {
    return {
      provider: delProvider || 'openai',
      model: delModel || ''
    };
  }
  const defaultRuntime =
    identity?.defaultRuntime && typeof identity.defaultRuntime === 'object'
      ? identity.defaultRuntime
      : null;
  const idProvider = asString(defaultRuntime?.provider);
  const idModel = asString(defaultRuntime?.model);
  if (idProvider || idModel) {
    return {
      provider: idProvider || 'openai',
      model: idModel || ''
    };
  }
  return null;
}

/**
 * @param {unknown} proof
 */
export function extractAgentContextFromProofs(proofs) {
  const identities = [];
  const delegations = [];
  const list = Array.isArray(proofs) ? proofs : [];

  for (const proof of list) {
    const qHash = asString(proof?.qHash);
    const verifiedVerifiers = Array.isArray(proof?.verifiedVerifiers) ? proof.verifiedVerifiers : [];
    for (const vv of verifiedVerifiers) {
      const verifierId = asString(vv?.verifierId);
      const vvData = vv?.data && typeof vv.data === 'object' ? vv.data : {};
      if (verifierId === 'agent-identity') {
        identities.push({
          qHash,
          agentId: vvData.agentId || null,
          agentWallet: vvData.agentWallet || null,
          agentLabel: vvData.agentLabel || vvData.agentId || 'Agent',
          agentType: vvData.agentType || 'agent',
          description: vvData.description || null,
          capabilities: capabilitiesToArray(vvData.capabilities),
          skills: Array.isArray(vvData.skills) ? vvData.skills : [],
          instructions: vvData.instructions || null,
          services: Array.isArray(vvData.services) ? vvData.services : [],
          defaultRuntime:
            vvData.defaultRuntime && typeof vvData.defaultRuntime === 'object'
              ? vvData.defaultRuntime
              : undefined
        });
      }
      if (verifierId === 'agent-delegation') {
        delegations.push({
          qHash,
          controllerWallet: vvData.controllerWallet || null,
          agentWallet: vvData.agentWallet || null,
          agentId: vvData.agentId || null,
          scope: vvData.scope || 'global',
          allowedActions: asStringArray(vvData.allowedActions),
          deniedActions: asStringArray(vvData.deniedActions),
          runtimePolicy:
            vvData.runtimePolicy && typeof vvData.runtimePolicy === 'object'
              ? vvData.runtimePolicy
              : undefined,
          expiresAt: vvData.expiresAt ?? null,
          isExpired: isDelegationExpired(vvData.expiresAt),
          maxSpend: vvData.maxSpend !== null ? String(vvData.maxSpend) : undefined,
          instructions: vvData.instructions || null,
          skills: Array.isArray(vvData.skills) ? vvData.skills : [],
          provider: vvData.provider || vvData.modelProvider || null,
          model: vvData.model || null
        });
      }
    }
  }

  return { identities, delegations };
}

/**
 * @param {Record<string, unknown>} input
 */
export function buildRuntimeBundle(input) {
  const identity = input.identity || {};
  const delegation = input.delegation || null;
  const identityQHash = asString(input.identityQHash || identity.qHash);
  const delegationQHash = delegation ? asString(input.delegationQHash || delegation.qHash) : null;
  const agentId = asString(identity.agentId);
  const agentWallet = normalizeWallet(identity.agentWallet);

  if (!identityQHash || !agentId || !agentWallet) {
    throw new Error('Runtime mount requires verified agent identity (agentId, agentWallet, identityQHash).');
  }

  const effectiveRuntime = resolveEffectiveRuntime(identity, delegation);
  const deniedActions = delegation ? asStringArray(delegation.deniedActions) : [];
  const allowedActions = delegation ? asStringArray(delegation.allowedActions) : undefined;
  const requiresHumanApproval =
    delegation?.runtimePolicy &&
    typeof delegation.runtimePolicy === 'object' &&
    delegation.runtimePolicy.requiresHumanApproval === true;

  const capabilities = asStringArray(identity.capabilities);
  const skills = Array.isArray(identity.skills) ? identity.skills : [];
  const skillIds = skills
    .map(skill =>
      typeof skill === 'string' ? skill : asString(skill?.id || skill?.label)
    )
    .filter(Boolean);

  const delegations = delegation ? [delegation] : [];
  const activeDelegations = delegations.filter(row => !row.isExpired).length;

  return {
    schema: RUNTIME_MOUNT_SCHEMA,
    mountedAt: new Date().toISOString(),
    trust: {
      identityQHash,
      delegationQHash: delegationQHash || null,
      identityProofUrl: `${PROOF_URL_BASE}${identityQHash}`,
      delegationProofUrl: delegationQHash ? `${PROOF_URL_BASE}${delegationQHash}` : null
    },
    identity: {
      agentId,
      agentWallet,
      agentLabel: asString(identity.agentLabel) || agentId,
      agentType: asString(identity.agentType) || 'agent',
      description: asString(identity.description) || undefined,
      instructions: asString(identity.instructions) || undefined,
      capabilities,
      skills,
      services: Array.isArray(identity.services) ? identity.services : undefined,
      defaultRuntime:
        identity.defaultRuntime && typeof identity.defaultRuntime === 'object'
          ? identity.defaultRuntime
          : undefined
    },
    delegation: delegation
      ? {
          controllerWallet: normalizeWallet(delegation.controllerWallet) || asString(delegation.controllerWallet),
          scope: asString(delegation.scope) || undefined,
          allowedActions,
          deniedActions,
          runtimePolicy: delegation.runtimePolicy,
          expiresAt: delegation.expiresAt ?? null,
          isExpired: Boolean(delegation.isExpired),
          maxSpend: delegation.maxSpend,
          instructions: asString(delegation.instructions) || undefined,
          skills: Array.isArray(delegation.skills) ? delegation.skills : undefined,
          provider: asString(delegation.provider) || undefined,
          model: asString(delegation.model) || undefined
        }
      : null,
    effectiveRuntime,
    tools: Array.isArray(input.tools) ? input.tools : [],
    secretBindings: Array.isArray(input.secretBindings) ? input.secretBindings : [],
    memoryRefs: Array.isArray(input.memoryRefs) ? input.memoryRefs : undefined,
    enforce: {
      deniedActions,
      ...(allowedActions?.length ? { allowedActions } : {}),
      ...(requiresHumanApproval ? { requiresHumanApproval: true } : {})
    },
    contextPack: {
      identityCount: 1,
      delegationCount: delegations.length,
      activeDelegations,
      capabilitiesSummary: capabilities.slice(0, 32),
      skillsSummary: skillIds.slice(0, 32)
    }
  };
}

/**
 * @param {Record<string, unknown>} profileAgent
 */
export function profileAgentToIdentitySeed(profileAgent) {
  return {
    agentId: profileAgent.agentId,
    agentWallet: profileAgent.agentWallet,
    agentLabel: profileAgent.agentLabel || profileAgent.name,
    agentType: profileAgent.agentType || profileAgent.typeLabel,
    description: profileAgent.description,
    instructions: profileAgent.instructions,
    capabilities: capabilitiesToArray(profileAgent.capabilities),
    skills: Array.isArray(profileAgent.skills) ? profileAgent.skills : [],
    services: Array.isArray(profileAgent.services) ? profileAgent.services : [],
    identityQHash: profileAgent.identityQHash || profileAgent.qHash
  };
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle | Record<string, unknown>} value
 */
export function isRuntimeBundle(value) {
  return Boolean(value && typeof value === 'object' && value.schema === RUNTIME_MOUNT_SCHEMA);
}

/**
 * Resolve mount via MCP (server tool first, then client assembly).
 *
 * @param {{
 *   callMcpTool: (args: { name: string, args?: Record<string, unknown>, accessKey?: string, sessionId?: string, signal?: AbortSignal }) => Promise<{ ok: boolean, payload?: unknown, error?: string }>,
 *   initializeMcp?: () => Promise<{ sessionId: string }>,
 *   accessKey: string,
 *   agentId?: string,
 *   agentWallet?: string,
 *   identityQHash?: string,
 *   signal?: AbortSignal
 * }} input
 */
export async function resolveRuntimeBundleFromMcp(input) {
  const accessKey = asString(input.accessKey);
  if (!accessKey) {
    throw new Error('NEUS access key or authenticated MCP session is required for runtime mount.');
  }

  const selector = {
    agentId: input.agentId,
    agentWallet: input.agentWallet,
    identityQHash: input.identityQHash
  };
  if (!selector.agentId && !selector.agentWallet && !selector.identityQHash) {
    throw new Error('Provide agentId, agentWallet, or identityQHash.');
  }

  let sessionId = '';
  if (input.initializeMcp) {
    const init = await input.initializeMcp();
    sessionId = init.sessionId || '';
  }

  const mountArgs = {
    ...(selector.agentId ? { agentId: selector.agentId } : {}),
    ...(selector.agentWallet ? { agentWallet: selector.agentWallet } : {}),
    ...(selector.identityQHash ? { identityQHash: selector.identityQHash } : {})
  };

  const serverMount = await input.callMcpTool({
    name: 'neus_agent_mount',
    args: mountArgs,
    accessKey,
    sessionId,
    signal: input.signal
  });

  if (serverMount.ok) {
    const payload = serverMount.payload;
    if (isRuntimeBundle(payload)) {
      return /** @type {import('./runtime-mount.js').RuntimeBundle} */ (payload);
    }
    if (payload && typeof payload === 'object' && isRuntimeBundle(payload.data)) {
      return /** @type {import('./runtime-mount.js').RuntimeBundle} */ (payload.data);
    }
  }

  const me = await input.callMcpTool({
    name: 'neus_me',
    args: {},
    accessKey,
    sessionId,
    signal: input.signal
  });
  if (!me.ok) {
    throw new Error(me.error || 'Could not load profile context. Run `neus auth` and retry.');
  }
  const mePayload = /** @type {Record<string, unknown>} */ (me.payload || {});
  if (mePayload.status === 'auth_required') {
    throw new Error('Profile authentication required. Run `neus auth` or set NEUS_ACCESS_KEY.');
  }

  const principal = /** @type {Record<string, unknown>} */ (mePayload.principal || {});
  const controllerWallet = normalizeWallet(principal.primaryAccount);
  const profileAgents = Array.isArray(mePayload.agents) ? mePayload.agents : [];

  let agentWallet = normalizeWallet(selector.agentWallet);
  let agentId = asString(selector.agentId);

  if (!agentWallet && agentId) {
    const row = profileAgents.find(
      row => asString(row.agentId).toLowerCase() === agentId.toLowerCase()
    );
    if (row) {
      agentWallet = normalizeWallet(row.agentWallet);
    }
  }
  if (!agentId && agentWallet) {
    const row = profileAgents.find(row => normalizeWallet(row.agentWallet) === agentWallet);
    if (row) agentId = asString(row.agentId);
  }
  if (!agentWallet && selector.identityQHash) {
    const idProof = await input.callMcpTool({
      name: 'neus_proofs_get',
      args: { qHash: selector.identityQHash, verifierId: 'agent-identity' },
      accessKey,
      sessionId,
      signal: input.signal
    });
    if (idProof.ok) {
      const data = /** @type {Record<string, unknown>} */ (idProof.payload?.data || idProof.payload || {});
      const proofs = Array.isArray(data.proofs) ? data.proofs : [];
      const extracted = extractAgentContextFromProofs(proofs);
      const identity = pickIdentity(extracted.identities, selector);
      if (identity) {
        agentWallet = normalizeWallet(identity.agentWallet);
        agentId = asString(identity.agentId);
      }
    }
  }

  if (!agentWallet) {
    throw new Error('Could not resolve agent wallet. Check agentId or link the agent on your profile.');
  }

  const [identityPage, delegationPage] = await Promise.all([
    input.callMcpTool({
      name: 'neus_proofs_get',
      args: { identifier: agentWallet, verifierId: 'agent-identity', limit: 25 },
      accessKey,
      sessionId,
      signal: input.signal
    }),
    controllerWallet
      ? input.callMcpTool({
          name: 'neus_proofs_get',
          args: { identifier: controllerWallet, verifierId: 'agent-delegation', limit: 50 },
          accessKey,
          sessionId,
          signal: input.signal
        })
      : Promise.resolve({ ok: false })
  ]);

  const identityProofs = identityPage.ok
    ? /** @type {unknown[]} */ (
        identityPage.payload?.data?.proofs || identityPage.payload?.proofs || []
      )
    : [];
  const delegationProofs = delegationPage.ok
    ? /** @type {unknown[]} */ (
        delegationPage.payload?.data?.proofs || delegationPage.payload?.proofs || []
      )
    : [];

  const idCtx = extractAgentContextFromProofs(identityProofs);
  const delCtx = extractAgentContextFromProofs(delegationProofs);

  let identity = pickIdentity(idCtx.identities, { ...selector, agentId, agentWallet });
  if (!identity && profileAgents.length > 0) {
    const row = profileAgents.find(
      a =>
        asString(a.agentId).toLowerCase() === agentId.toLowerCase() ||
        normalizeWallet(a.agentWallet) === agentWallet
    );
    if (row) {
      identity = { ...profileAgentToIdentitySeed(row), agentWallet, agentId: agentId || asString(row.agentId) };
    }
  }
  if (!identity) {
    throw new Error('Agent identity proof not found. Complete agent setup on neus.network first.');
  }

  const delegation = pickActiveDelegation(
    delCtx.delegations,
    controllerWallet,
    agentWallet,
    agentId || asString(identity.agentId)
  );

  return buildRuntimeBundle({
    identity,
    delegation,
    identityQHash: asString(identity.qHash || selector.identityQHash),
    delegationQHash: delegation ? asString(delegation.qHash) : null,
    tools: [],
    secretBindings: []
  });
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle | Record<string, unknown> | null | undefined} manifest
 */
export function evaluateMountFileHealth(manifest) {
  if (!manifest || manifest.schema !== RUNTIME_MOUNT_SCHEMA) {
    return {
      mountFileValid: false,
      missingDelegation: true,
      delegationExpired: false,
      needsRefresh: true,
      reason: 'missing_or_invalid'
    };
  }

  const delegationQHash = asString(manifest.trust?.delegationQHash);
  const missingDelegation = !delegationQHash;
  const expiresAt = manifest.delegation?.expiresAt;
  const delegationExpired =
    Boolean(manifest.delegation?.isExpired) || isDelegationExpired(expiresAt);

  return {
    mountFileValid: true,
    missingDelegation,
    delegationExpired,
    needsRefresh: missingDelegation || delegationExpired,
    reason: delegationExpired
      ? 'delegation_expired'
      : missingDelegation
        ? 'delegation_missing'
        : null
  };
}

/**
 * Build a runtime mount bundle from a roster (identities + delegations extracted from proofs).
 * Non-throwing: returns { error, message } when identity is missing or the bundle cannot be built.
 * Selector picks the identity by agentId / agentWallet / identityQHash, then resolves the active
 * delegation from the roster. This is the convenience wrapper used by protocol MCP and neus BFF.
 *
 * @param {{ identities?: Array<Record<string, unknown>>, delegations?: Array<Record<string, unknown>> }} roster
 * @param {{ agentId?: string, agentWallet?: string, identityQHash?: string }} selector
 * @param {string} controllerWallet
 */
export function buildRuntimeMountFromRoster(roster, selector, controllerWallet) {
  const identities = Array.isArray(roster?.identities) ? roster.identities : [];
  const delegations = Array.isArray(roster?.delegations) ? roster.delegations : [];
  const identity = pickIdentity(identities, selector);
  if (!identity) {
    return {
      error: 'identity_not_found',
      message: 'No agent-identity proof matches the requested agent.',
    };
  }
  const agentWallet = normalizeWallet(identity.agentWallet);
  const agentId = asString(identity.agentId);
  const delegation = pickActiveDelegation(delegations, controllerWallet, agentWallet, agentId);
  try {
    return buildRuntimeBundle({
      identity,
      delegation,
      identityQHash: asString(identity.qHash || selector.identityQHash),
      delegationQHash: delegation ? asString(delegation.qHash) : null,
      tools: [],
      secretBindings: []
    });
  } catch (err) {
    return {
      error: 'mount_incomplete',
      message: err && err.message ? err.message : 'Runtime mount bundle could not be built.'
    };
  }
}
