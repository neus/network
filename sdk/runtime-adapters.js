/**
 * Runtime Mount adapters — apply proof-backed bundles to host workspaces.
 */

import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_MOUNT_SCHEMA } from './runtime-mount.js';

export const MOUNT_MANIFEST_RELATIVE = path.join('.neus', 'mount.json');

/**
 * @param {string} agentId
 */
export function sanitizeAgentIdForFilename(agentId) {
  return String(agentId || 'agent')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'agent';
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle} bundle
 */
export function bundleToCursorRules(bundle) {
  const id = bundle.identity.agentId;
  const label = bundle.identity.agentLabel || id;
  const skillsBlock = (bundle.identity.skills || [])
    .map(skill => {
      if (typeof skill === 'string') return `- ${skill}`;
      const labelText = skill.label || skill.id || 'skill';
      const kind = skill.kind || 'skill';
      const provider = skill.provider ? ` / ${skill.provider}` : '';
      return `- ${labelText} (${kind}${provider})`;
    })
    .join('\n');

  const denied = (bundle.enforce.deniedActions || []).map(action => `- ${action}`).join('\n');
  const capabilities = (bundle.identity.capabilities || []).map(cap => `- ${cap}`).join('\n');
  const services = (bundle.identity.services || [])
    .map(svc => `- ${svc.name}: ${svc.endpoint}${svc.version ? ` (v${svc.version})` : ''}`)
    .join('\n');

  return `---
description: Verified NEUS agent — ${label}
globs:
alwaysApply: true
---

# NEUS Agent — ${label}

You are **${label}** (\`${id}\`). This project loaded your current NEUS identity and permissions.

## Identity
${bundle.identity.description || bundle.identity.instructions || 'Follow the agent instructions below.'}

## Instructions
${bundle.identity.instructions || 'Use NEUS MCP for trust checks before sensitive actions.'}

## Capabilities
${capabilities || '- General purpose'}

## Skills
${skillsBlock || '- None configured'}

## Services
${services || '- None configured'}

## Permission limits
${denied ? `Denied actions (do not perform without new approval):\n${denied}` : '- Follow the current permission receipt through NEUS MCP.'}

## Trust workflow
1. Call \`neus_context\` once per session when NEUS MCP is available.
2. Before a sensitive action, call \`neus_proofs_check\` and then \`neus_verify_or_guide\` when needed.
3. Do not invent receipt IDs, accounts, or receipt fields.
4. Summarize the result as Passed, Action needed, or Blocked. Do not show raw tool output.

## Receipt references
- Identity: ${bundle.trust.identityProofUrl}
${bundle.trust.delegationProofUrl ? `- Permissions: ${bundle.trust.delegationProofUrl}` : '- Permissions: not on file — call `neus_agent_link` before acting as this agent.'}
`;
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle} bundle
 */
export function bundleToClaudeMd(bundle) {
  const id = bundle.identity.agentId;
  const label = bundle.identity.agentLabel || id;
  return `# NEUS Agent — ${label}

Loaded from NEUS agent context (\`${RUNTIME_MOUNT_SCHEMA}\`).

## Identity
- **Agent ID:** ${id}
- **Label:** ${label}

## Description
${bundle.identity.description || 'Verified agent on NEUS Network.'}

## Instructions
${bundle.identity.instructions || 'Use NEUS MCP before sensitive actions.'}

## Trust receipts
- Identity: \`${bundle.trust.identityQHash}\` — ${bundle.trust.identityProofUrl}
${bundle.trust.delegationQHash ? `- Permissions: \`${bundle.trust.delegationQHash}\` — ${bundle.trust.delegationProofUrl}` : ''}

## Policy
- Do not invent receipt IDs or check outcomes.
- Call \`neus_context\` once; use profile context when signed in.
`;
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle} bundle
 */
export function bundleToCodexJson(bundle) {
  return JSON.stringify(
    {
      schema: RUNTIME_MOUNT_SCHEMA,
      name: bundle.identity.agentLabel,
      agentId: bundle.identity.agentId,
      agentWallet: bundle.identity.agentWallet,
      description: bundle.identity.description,
      instructions: bundle.identity.instructions,
      capabilities: bundle.identity.capabilities,
      skills: bundle.identity.skills,
      services: bundle.identity.services,
      effectiveRuntime: bundle.effectiveRuntime,
      enforce: bundle.enforce,
      trust: bundle.trust,
      mountedAt: bundle.mountedAt
    },
    null,
    2
  );
}

/**
 * @param {string} cwd
 */
export function readMountManifest(cwd) {
  const manifestPath = path.join(cwd, MOUNT_MANIFEST_RELATIVE);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return parsed?.schema === RUNTIME_MOUNT_SCHEMA ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {import('./runtime-mount.js').RuntimeBundle} bundle
 * @param {string} cwd
 */
export function writeMountManifest(bundle, cwd) {
  const dir = path.join(cwd, '.neus');
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, 'mount.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  return manifestPath;
}

/**
 * @param {'cursor' | 'claude' | 'codex'} flavor
 * @param {import('./runtime-mount.js').RuntimeBundle} bundle
 * @param {string} cwd
 * @param {{ dryRun?: boolean }} [options]
 */
export function applyRuntimeBundle(flavor, bundle, cwd, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const safeId = sanitizeAgentIdForFilename(bundle.identity.agentId);
  const written = [];

  const manifestPath = dryRun
    ? path.join(cwd, MOUNT_MANIFEST_RELATIVE)
    : writeMountManifest(bundle, cwd);
  written.push(manifestPath);

  if (flavor === 'cursor') {
    const rulesDir = path.join(cwd, '.cursor', 'rules');
    const rulesPath = path.join(rulesDir, `neus-agent-${safeId}.mdc`);
    if (!dryRun) {
      fs.mkdirSync(rulesDir, { recursive: true });
      fs.writeFileSync(rulesPath, bundleToCursorRules(bundle), 'utf8');
    }
    written.push(rulesPath);
    return { flavor, written, primary: rulesPath, manifestPath };
  }

  if (flavor === 'claude') {
    const claudePath = path.join(cwd, '.claude', 'NEUS_AGENT.md');
    if (!dryRun) {
      fs.mkdirSync(path.join(cwd, '.claude'), { recursive: true });
      fs.writeFileSync(claudePath, bundleToClaudeMd(bundle), 'utf8');
    }
    written.push(claudePath);
    return { flavor, written, primary: claudePath, manifestPath };
  }

  if (flavor === 'codex') {
    const codexPath = path.join(cwd, '.neus', `codex-agent-${safeId}.json`);
    if (!dryRun) {
      fs.mkdirSync(path.join(cwd, '.neus'), { recursive: true });
      fs.writeFileSync(codexPath, bundleToCodexJson(bundle), 'utf8');
    }
    written.push(codexPath);
    return { flavor, written, primary: codexPath, manifestPath };
  }

  throw new Error(`Unsupported runtime adapter: ${flavor}`);
}
