# Skills (Claude / Cursor compatible)

Skills are folders with `SKILL.md` (YAML frontmatter + instructions).

## Locations (project overrides global on name collision)
- `.claude/skills/<name>/`
- `.cursor/skills/<name>/`
- `.neus/skills/<name>/`
- `~/.claude/skills/<name>/` (global)

## Frontmatter
- `description` — shown in the agent index (Level 1)
- `user-invocable: true` — user can run `/skill-name task` in chat
- `disable-model-invocation: true` — slash-only; agent will not auto-load

## In chat
Type `/example` or `/frontend-design build a login form` to invoke a skill.
The agent can also call `load_agent_skill` and `read_skill_file` when intent matches.