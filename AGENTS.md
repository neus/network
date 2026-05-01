# AGENTS.md

Telegraph style. Repo rules only. Read `../_workspace/AGENTS.md` first when available.

## Role

This repo owns public NEUS developer surfaces.

## Work here for

- public docs
- SDK docs
- widgets
- examples
- protocol references
- MCP docs
- verifier docs
- integration guides

## Rules

- Public docs must match live implementation.
- Separate live, beta, demo, and planned behavior.
- Do not include private company strategy.
- Do not include internal partner notes.
- Do not include secrets or operator commentary.
- Prefer working examples over abstract prose.
- Keep docs concise and Stripe-grade.

## MCP docs

MCP docs should point developers toward the actual tool path:

- `neus_context`
- `neus_verify`
- `neus_verify_or_guide`
- `neus_proofs_get`
- `neus_me`
- `neus_agent_create`
- `neus_agent_link`

## Checks

Run relevant docs/build checks only for touched surfaces.
