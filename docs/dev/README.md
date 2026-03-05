# Developer Docs

Build on the NEUS proof layer with a direct path from first integration to production rollout.

## Start here

- [Quickstart](../QUICKSTART.md) for first proof creation and gating.
- [Integration](../integration.md) for production-ready integration.
- [API Overview](../api/README.md) and [Public API Spec](../api/public-api.json) for endpoint contracts.
- [Verifier Catalog](../verifiers/README.md) for verifier capabilities and schema links.
- [SDK Reference](../../sdk/README.md) and [Widgets](../../sdk/widgets/README.md) for implementation details.

## Production priorities

- Keep proofs private by default unless public discovery is required.
- Enforce freshness for point-in-time checks (`since`, `sinceDays`, or `strategy="fresh"`).
- Use hosted checkout for interactive verifiers.
- Treat `proofId` as the standard identifier.
