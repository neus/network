# Contributing to NEUS Network

Thank you for your interest in contributing to NEUS Network. We welcome contributions to extend the universal verification ecosystem.

## Getting Started

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/neus/network.git
   cd network
   ```

2. **Install dependencies**
   ```bash
   # Install SDK dependencies
   cd sdk && npm install && cd ..
   
   # Install widgets dependencies
   cd widgets && npm install && cd ..
   ```

3. **Run tests**
   ```bash
   # Test SDK
   cd sdk && npm test && cd ..
   
   # Test widgets
   cd widgets && npm test && cd ..
   ```

## How to Contribute

### Reporting Issues

- **Bug Reports**: Use GitHub Issues with reproduction steps
- **Feature Requests**: Use GitHub Issues with clear use case
- **Security Issues**: Email dev@neus.network (do not create public issues)

### Code Contributions

1. Create feature branch from main
2. Make changes following coding standards
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request with clear description

### Coding Standards

- **JavaScript**: Follow existing ESLint configuration
- **Solidity**: Follow existing contract patterns and security practices
- **Documentation**: Update README files for API changes
- **Tests**: Maintain test coverage for new features
- **Commits**: Use clear, descriptive commit messages

## Contributing Verifiers

New verification types can extend the ecosystem through community contributions.

### Verifier Contribution Process

1. **Propose Verifier**: Submit GitHub issue with specification
2. **Technical Review**: Community and maintainer review
3. **Implementation**: Build following verifier standards
4. **Testing**: Comprehensive test coverage required
5. **Documentation**: Complete examples and schemas
6. **Deployment**: Integration into Core Registry after approval

### High-Priority Verifiers

The community has identified these high-value verifiers for development:

1. **GitHub Repository Ownership** - Prove repository ownership/maintenance
2. **Discord Server Ownership** - Prove Discord server ownership/administration
3. **Professional Credentials** - Verify degrees, certifications, professional licenses
4. **Geographic Verification** - Location-based proofs without revealing exact coordinates
5. **Temporal Proofs** - Time-based claims, deadlines, scheduling verification

### Verifier Requirements

**Technical Standards:**
- Deterministic outputs for same inputs
- No PII in inputs or outputs
- Proper error handling for all failure modes
- Gas optimization for on-chain operations
- Rate limiting for external APIs

**Documentation Standards:**
- Clear API documentation with examples
- JSON schema for input/output validation
- Integration examples and use cases
- Security best practices

**Testing Standards:**
- Unit tests for all functions
- Integration tests with live APIs where applicable
- Error condition testing
- Performance benchmarking

## Development Guidelines

### Verifier Specification Template

```markdown
# Verifier: your-verifier-id

## Purpose
Brief description of what this verifier proves.

## Input Schema
```json
{
  "type": "object",
  "required": ["field1", "field2"],
  "properties": {
    "field1": {"type": "string", "description": "Description"},
    "field2": {"type": "number", "description": "Description"}
  }
}
```

## Output Schema
```json
{
  "owner": "address",
  "verified": "boolean", 
  "timestamp": "number",
  "data": "object"
}
```

## Examples
[SDK and HTTP API examples]

## Dependencies
- On-chain: Contract ABIs and RPC endpoints
- External: API endpoints and rate limits

## Testing
[Test plan and validation approach]
```

### SDK Development
- All changes must pass existing tests
- New features require comprehensive tests
- Maintain backward compatibility when possible
- Follow semantic versioning for releases

### Documentation
- Keep README files up to date
- Include code examples for new features
- Use clear, concise language
- Test all code examples

### Testing
- Write unit tests for new functions
- Include integration tests for API changes
- Test against live testnet when appropriate
- Ensure tests run in CI environment

## Pull Request Process

1. **Create descriptive PR title** and description
2. **Link related issues** if applicable
3. **Ensure all tests pass** in CI
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** before merge if requested

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Maintain professional communication

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: dev@neus.network for direct contact

## Developer Certificate of Origin

By contributing to NEUS Network, you certify the Developer Certificate of Origin (DCO) and must include a "Signed-off-by" line in your commits:

```
git commit -s -m "Your commit message"

Signed-off-by: Your Name <your.email@example.com>
```

This certifies that you have the right to submit the contribution under the project's license.

## Licensing for Contributions

NEUS Network uses a dual-licensing structure depending on the component being contributed to:

### Smart Contracts (Business Source License 1.1)
Contributions to the `contracts/` directory are licensed under **Business Source License 1.1**:
- **Components**: Smart contracts, interfaces, libraries in `contracts/`
- **License**: Business Source License 1.1 (converts to Apache 2.0 on August 1, 2028)
- **Usage**: Permitted for integration, testing, and auditing; competing networks prohibited until conversion

Exception: the testnet NEUSToken contract may be MIT for interoperability; core contracts remain BSL 1.1.

### Developer Tools (Apache 2.0)
Contributions to SDK, widgets, docs, and examples are licensed under **Apache 2.0**:
- **Components**: `sdk/`, `widgets/`, `docs/`, `examples/`, `abis/`
- **License**: Apache License 2.0
- **Usage**: Unrestricted commercial and open source use

By contributing to NEUS Network, you agree that:
1. **Smart contract contributions** will be licensed under Business Source License 1.1
2. **Developer tool contributions** will be licensed under Apache License 2.0
3. You have the right to submit the contribution under the applicable license
4. You retain copyright but grant NEUS Network, Inc. necessary rights for the project

© NEUS Network, Inc. All rights reserved. See LICENSE for complete terms.

## Recognition

Contributors will be recognized in:
- Repository contributor list
- Release notes for significant contributions
- Project documentation where appropriate

## Questions?

If you have questions about contributing, please:
1. Check existing GitHub Issues and Discussions
2. Review this contributing guide
3. Email dev@neus.network for direct assistance

Thank you for helping make NEUS Network better!
