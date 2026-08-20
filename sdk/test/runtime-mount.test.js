import { describe, expect, it } from 'vitest';
import {
  buildRuntimeBundle,
  normalizeQHash,
  pickActiveDelegation,
  pickIdentity,
  resolveRuntimeBundleFromMcp,
  resolveEffectiveRuntime,
  RUNTIME_MOUNT_SCHEMA,
  evaluateMountFileHealth,
  evaluateRuntimeAction
} from '../runtime-mount.js';
import { applyRuntimeBundle, bundleToCursorRules, readMountManifest } from '../runtime-adapters.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('runtime-mount', () => {
  const identity = {
    qHash: `0x${  'a'.repeat(64)}`,
    agentId: 'demo-agent',
    agentWallet: '0x1111111111111111111111111111111111111111',
    agentLabel: 'Demo Agent',
    agentType: 'agent',
    instructions: 'Always verify trust before deploy.',
    capabilities: ['mcp', 'proofs'],
    skills: [{ id: 'neus-trust-workflow', label: 'NEUS Trust Workflow', kind: 'native' }],
    defaultRuntime: { provider: 'openai', model: 'gpt-4.1-mini' }
  };

  const delegation = {
    qHash: `0x${  'b'.repeat(64)}`,
    controllerWallet: '0x2222222222222222222222222222222222222222',
    agentWallet: identity.agentWallet,
    agentId: identity.agentId,
    scope: 'global',
    deniedActions: ['send_message'],
    runtimePolicy: { requiresHumanApproval: true },
    approvalPolicy: {
      humanApprovalRequiredForNewClaims: true,
      preApprovedContentOnly: true
    },
    provider: 'openai',
    model: 'gpt-4.1',
    isExpired: false
  };

  it('builds a runtime bundle with schema v1', () => {
    const bundle = buildRuntimeBundle({ identity, delegation });
    expect(bundle.schema).toBe(RUNTIME_MOUNT_SCHEMA);
    expect(bundle.identity.agentId).toBe('demo-agent');
    expect(bundle.trust.identityQHash).toBe(identity.qHash);
    expect(bundle.enforce.deniedActions).toContain('send_message');
    expect(bundle.enforce.requiresHumanApproval).toBe(true);
    expect(bundle.enforce.approvalPolicy).toEqual({
      humanApprovalRequiredForNewClaims: true,
      preApprovedContentOnly: true
    });
    expect(bundle.effectiveRuntime).toEqual({ provider: 'openai', model: 'gpt-4.1' });
  });

  it('normalizes qHashes and rejects malformed proof references at the bundle boundary', () => {
    expect(normalizeQHash(identity.qHash.slice(2).toUpperCase())).toBe(identity.qHash);
    expect(normalizeQHash('not-a-proof')).toBe('');
    expect(() => buildRuntimeBundle({ identity: { ...identity, qHash: 'not-a-proof' } })).toThrow(
      /verified agent identity/,
    );
  });

  it('prefers delegation runtime over identity default', () => {
    const runtime = resolveEffectiveRuntime(identity, delegation);
    expect(runtime?.model).toBe('gpt-4.1');
  });

  it('picks identity and delegation by agentId', () => {
    const identities = [identity];
    const delegations = [delegation];
    const picked = pickIdentity(identities, { agentId: 'demo-agent' });
    expect(picked?.agentId).toBe('demo-agent');
    const del = pickActiveDelegation(
      delegations,
      delegation.controllerWallet,
      identity.agentWallet,
      identity.agentId
    );
    expect(del?.scope).toBe('global');
  });

  it('requests explicit proof content when the mount fallback reads identity records', async () => {
    const calls = [];
    const callMcpTool = async request => {
      calls.push(request);
      if (request.name === 'neus_agent_mount') return { ok: false, error: 'unavailable' };
      if (request.name === 'neus_context') {
        return {
          ok: true,
          payload: {
            profileContext: {
              status: 'ok',
              principal: { primaryAccount: delegation.controllerWallet },
              agents: [{
                agentId: identity.agentId,
                agentWallet: identity.agentWallet,
                identityQHash: identity.qHash
              }]
            }
          }
        };
      }
      if (request.name === 'neus_proofs_get' && request.args.verifierId === 'agent-identity') {
        return {
          ok: true,
          payload: {
            data: {
              proofs: [{
                qHash: identity.qHash,
                walletAddress: identity.agentWallet,
                verifiedVerifiers: [{
                  verifierId: 'agent-identity',
                  verified: true,
                  data: identity
                }]
              }]
            }
          }
        };
      }
      if (request.name === 'neus_proofs_get' && request.args.verifierId === 'agent-delegation') {
        return {
          ok: true,
          payload: {
            data: {
              proofs: [{
                qHash: delegation.qHash,
                walletAddress: identity.agentWallet,
                verifiedVerifiers: [{
                  verifierId: 'agent-delegation',
                  verified: true,
                  data: delegation
                }]
              }]
            }
          }
        };
      }
      return { ok: false, error: 'unexpected call' };
    };

    const bundle = await resolveRuntimeBundleFromMcp({
      callMcpTool,
      accessKey: 'test-access-key',
      agentId: identity.agentId
    });

    expect(bundle.identity.agentId).toBe(identity.agentId);
    const proofReads = calls.filter(call => call.name === 'neus_proofs_get');
    expect(proofReads).toHaveLength(2);
    expect(proofReads.every(call => call.args.include === 'content')).toBe(true);
  });

  it('builds an identity-only fallback from the authenticated profile association', async () => {
    const calls = [];
    const callMcpTool = async request => {
      calls.push(request);
      if (request.name === 'neus_agent_mount') {
        return { ok: true, payload: { error: 'identity_not_found' } };
      }
      if (request.name === 'neus_context') {
        return {
          ok: true,
          payload: {
            profileContext: {
              status: 'ok',
              principal: { primaryAccount: identity.agentWallet },
              agents: [{
                agentId: identity.agentId,
                agentWallet: identity.agentWallet,
                identityQHash: identity.qHash
              }]
            }
          }
        };
      }
      if (request.name === 'neus_proofs_get') {
        return { ok: true, payload: { data: { proofs: [] } } };
      }
      return { ok: false, error: 'unexpected call' };
    };

    const bundle = await resolveRuntimeBundleFromMcp({
      callMcpTool,
      accessKey: 'test-access-key',
      agentId: identity.agentId
    });

    expect(bundle.identity.agentId).toBe(identity.agentId);
    expect(bundle.trust.identityQHash).toBe(identity.qHash);
    expect(bundle.delegation).toBeNull();
  });

  it('writes cursor adapter files', () => {
    const bundle = buildRuntimeBundle({ identity, delegation });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'neus-mount-'));
    const result = applyRuntimeBundle('cursor', bundle, tmp);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(fs.existsSync(result.primary)).toBe(true);
    const rules = fs.readFileSync(result.primary, 'utf8');
    expect(rules).toContain('Demo Agent');
    expect(bundleToCursorRules(bundle)).toContain('neus_context');
    const manifest = readMountManifest(tmp);
    expect(manifest?.identity.agentId).toBe('demo-agent');
  });
  describe('evaluateMountFileHealth', () => {
    it('reports needsRefresh false for valid bundle with delegation', () => {
      const bundle = buildRuntimeBundle({ identity, delegation });
      const health = evaluateMountFileHealth(bundle);
      expect(health.mountFileValid).toBe(true);
      expect(health.needsRefresh).toBe(false);
      expect(health.missingDelegation).toBe(false);
      expect(health.delegationExpired).toBe(false);
      expect(health.reason).toBe(null);
    });

    it('reports needsRefresh true when delegationQHash is missing', () => {
      const bundle = buildRuntimeBundle({ identity });
      const health = evaluateMountFileHealth(bundle);
      expect(health.mountFileValid).toBe(true);
      expect(health.needsRefresh).toBe(true);
      expect(health.missingDelegation).toBe(true);
      expect(health.reason).toBe('delegation_missing');
    });

    it('reports needsRefresh true when delegation is expired', () => {
      const bundle = buildRuntimeBundle({
        identity,
        delegation: { ...delegation, isExpired: true }
      });
      const health = evaluateMountFileHealth(bundle);
      expect(health.mountFileValid).toBe(true);
      expect(health.needsRefresh).toBe(true);
      expect(health.delegationExpired).toBe(true);
      expect(health.reason).toBe('delegation_expired');
    });
  });

  describe('evaluateRuntimeAction', () => {
    it('allows an action in the current allowlist', () => {
      const bundle = buildRuntimeBundle({
        identity,
        delegation: { ...delegation, allowedActions: ['read_proofs'], deniedActions: [] }
      });

      expect(evaluateRuntimeAction(bundle, 'read_proofs')).toMatchObject({
        decision: 'allowed',
        allowed: true,
        code: 'ACTION_ALLOWED'
      });
    });

    it('applies denied actions before allowed actions', () => {
      const bundle = buildRuntimeBundle({
        identity,
        delegation: {
          ...delegation,
          allowedActions: ['send_message'],
          deniedActions: ['send_message']
        }
      });

      expect(evaluateRuntimeAction(bundle, 'send_message')).toMatchObject({
        decision: 'denied',
        allowed: false,
        code: 'ACTION_DENIED'
      });
    });

    it('denies an action missing from a non-empty allowlist', () => {
      const bundle = buildRuntimeBundle({
        identity,
        delegation: { ...delegation, allowedActions: ['read_proofs'], deniedActions: [] }
      });

      expect(evaluateRuntimeAction(bundle, 'send_message')).toMatchObject({
        decision: 'denied',
        code: 'ACTION_NOT_ALLOWED'
      });
    });

    it('fails closed when permission state is missing or expired', () => {
      const identityOnly = buildRuntimeBundle({ identity });
      const expired = buildRuntimeBundle({
        identity,
        delegation: { ...delegation, isExpired: true }
      });

      expect(evaluateRuntimeAction(identityOnly, 'read_proofs').code).toBe('PERMISSION_REQUIRED');
      expect(evaluateRuntimeAction(expired, 'read_proofs').code).toBe('PERMISSION_EXPIRED');
    });

    it('pauses irreversible actions when human approval is required', () => {
      const bundle = buildRuntimeBundle({ identity, delegation });

      expect(evaluateRuntimeAction(bundle, 'read_proofs', { irreversible: true })).toMatchObject({
        decision: 'approval_required',
        allowed: false,
        code: 'HUMAN_APPROVAL_REQUIRED'
      });
    });
  });
});
