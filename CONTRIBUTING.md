# Contributing

**If you are integrating NEUS into a product**, use **[docs.neus.network](https://docs.neus.network)** and the live product first. The table below is for people proposing changes here.

| Need | Where |
| --- | --- |
| Product documentation | [docs.neus.network](https://docs.neus.network) |
| Possible bugs | [Issues](https://github.com/neus/network/issues) |
| Ideas and questions | [Discussions](https://github.com/neus/network/discussions) |
| Security reports | [dev@neus.network](mailto:dev@neus.network) (do not post publicly) |
| Release notes | [CHANGELOG.md](./CHANGELOG.md) |

## What helps

- Bug reports with clear steps to reproduce and no secrets in the thread.
- Verifier proposals that spell out the user-visible outcome you want. Open a [Discussion](https://github.com/neus/network/discussions) first; a PR should include the spec, schema, and docs together.
- Updates to the SDK, examples, or documentation that match what the live product does today.
- Tests or examples when you change behavior that builders rely on.

**Do not** share keys, tokens, bearer secrets, or private proof content in public issues or change descriptions.

## Verifier proposals

The public verifier catalog and input schemas live in **this repo**: JSON Schemas under [`docs/verifiers/schemas/`](./docs/verifiers/schemas) and the machine index at [`spec/VERIFIERS.json`](./spec/VERIFIERS.json). A contributor opens a PR here to add a new check; once merged, it propagates to the protocol verifier registry. See [Propose a verifier](https://docs.neus.network/verification/propose-a-verifier) for the full flow.

## Do not commit

These paths are local-only or generated elsewhere (see `.gitignore`):

- `.env`, `.npmrc`, secrets, and key material
- `sdk/cjs/` and other build artifacts

## Describing your change

Explain **what builders or end users will experience differently** (for example new fields, new errors, or renamed concepts). If you adjust verifiers or any documented HTTP surface, keep the written API reference and examples aligned with the live product.