# NEUS Copilot Instructions

Classify before acting. Read ACTIVE_GOAL.md for the current objective, then read .neus/context/COMPILED_CONTEXT.md for policy gate, hard rules, and source routing.

Canonical source: _workspace. Repo-local .neus/context is generated.

Classify every request before acting (ANSWER_ONLY / AUDIT_ONLY / PLAN_ONLY / IMPLEMENT_ALLOWED / STOP_REQUIRED). Use existing production paths. No parallel systems. Prefer in-place edits. Verify before claiming success. Route high-risk actions through the trust harness.
