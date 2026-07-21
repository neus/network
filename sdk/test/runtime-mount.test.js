import { describe, expect, it } from 'vitest';
import {
  buildRuntimeBundle,
  pickActiveDelegation,
  pickIdentity,
  resolveEffectiveRuntime,
  RUNTIME_MOUNT_SCHEMA,
  evaluateMountFileHealth
} from '../runtime-mount.js';
import { applyRuntimeBundle, bundleToCursorRules, readMountManifest } from '../runtime-adapters.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('runtime-mount', () => {
  const identity = {
    qHash: '0x' + 'a'.repeat(64),
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
    qHash: '0x' + 'b'.repeat(64),
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
});
