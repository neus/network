# Contributing

Thank you for your interest in contributing to NEUS Network. We welcome contributions from the community!

---

## Getting Started

```bash
git clone https://github.com/neus/network.git
cd network

# Install SDK dependencies
cd sdk && npm install && cd ..

# Run tests
cd sdk && npm test && cd ..
```

---

## How to Contribute

| Type | Where |
|------|-------|
| Bug reports | [GitHub Issues](https://github.com/neus/network/issues) |
| Ideas & questions | [GitHub Discussions](https://github.com/neus/network/discussions) |
| Security issues | [dev@neus.network](mailto:dev@neus.network) (do not create public issues) |
| Code contributions | Pull requests |

---

## Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make changes following coding standards
4. Add tests for new functionality
5. Submit pull request with clear description

**Standards:**
- Follow existing ESLint configuration
- Maintain test coverage
- Update documentation for API changes
- Use clear commit messages

---

## Contributing Verifiers

New verification types can extend the ecosystem.

**Process:**
1. **Propose** — Start a [GitHub Discussion](https://github.com/neus/network/discussions)
2. **Implement** — Follow verifier standards
3. **Submit** — PR with `spec/VERIFIERS.json` updates + input schema + docs
4. **Validate** — Run `cd sdk && npm test`
5. **Review** — Technical and community review
6. **Merge** — Maintainers merge to `main`

**Requirements:**
- Deterministic outputs for same inputs
- No PII in inputs or outputs
- JSON schemas for validation
- Test coverage

---

## Licensing

| Component | License |
|-----------|---------|
| Smart contracts (`contracts/`) | Business Source License 1.1 |
| SDK, widgets, docs, examples | Apache 2.0 |

By contributing, you agree that your contributions will be licensed under the appropriate license for each component.

---

## Developer Certificate of Origin

Include "Signed-off-by" in commits:

```bash
git commit -s -m "Your commit message"
```

---

## Questions?

- [GitHub Issues](https://github.com/neus/network/issues)
- [GitHub Discussions](https://github.com/neus/network/discussions)
- [dev@neus.network](mailto:dev@neus.network)
