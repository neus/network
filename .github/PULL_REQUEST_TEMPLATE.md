## Summary

<!-- One sentence: what changed and why. -->

## Integrator-visible change

<!-- If this changes anything an integrator sees (API field, verifier behavior, SDK signature, docs, MCP tool, pricing), describe it here. If purely internal, say "No integrator-visible change." -->

## Verifier / API / Checkout alignment

- [ ] No verifier catalog change, or `spec/VERIFIERS.json` + OpenAPI + docs are updated together
- [ ] No API change, or `docs/openapi/public-api.json` + `docs/api/overview.mdx` are updated
- [ ] No gate/checkout change, or `docs/platform/hosted-gate-checkout.mdx` + SDK `getGate`/`fulfillGate` are aligned
- [ ] No MCP tool change, or `mcp/npm-dist/server.json` is updated and matches the hosted server

## Release versioning

- [ ] No version bump needed, or `scripts/verify-release-versions.mjs` surfaces are all updated to the same version

## Checks

- [ ] `npm test` passes (SDK)
- [ ] `npm run docs:validate` passes (markdown + OpenAPI lint)
- [ ] `node scripts/validate-universal-manifests.mjs` passes (if manifests touched)
- [ ] `node scripts/verify-release-versions.mjs <version>` passes (if version bumped)

## Changelog

- [ ] Added a `[Unreleased]` entry in `CHANGELOG.md` for any integrator-visible change