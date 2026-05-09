# CLAUDE.md

Read `.neus/context/COMPILED_CONTEXT.md` first — it contains the canonical NEUS operating context compiled from `_workspace`.

## Critical warnings

- **Do not rely on global user-folder skills for launch-critical tasks.** The canonical context is in `_workspace` and the compiled context in `.neus/context/`.
- **Do not call subagents for deterministic build tasks** unless explicitly requested.
- **For decks/artifacts, require real output files and verification** — not markdown-only specs.
- **Route high-risk actions through the trust harness.** See `_workspace/tools/trust-harness/guarded-action.mjs`.

`_workspace` is the canonical source. Repo-local `.neus/context` is generated.
