# DESIGN.md — design system tokens

## Colors
- Use CSS variables from the app theme (`var(--accent)`, `var(--text-primary)`, etc.).
- Do not hard-code hex values unless adding new tokens.

## Typography
- UI: system / Inter stack, 12–14px labels, 13px body.
- Code: `Consolas, 'Cascadia Code', monospace`.

## Spacing
- Prefer 4px grid: 4, 8, 12, 16, 24.

## Components
Before generating UI in `**/*.tsx`, read this file and reuse existing patterns.