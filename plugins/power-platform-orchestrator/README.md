# Power Platform Orchestrator

Coordinates complete Power Platform projects that require multiple plugins, such as a Power Pages site, Dataverse data model, Canvas App, Code App, authentication, permissions, and deployment.

## When To Use

Use the orchestrator for multi-component requests:

- "Create a customer portal with authentication and a manager dashboard"
- "Build an HR solution with an employee portal and a Canvas App"
- "Set up a Power Platform project with a website, data model, and admin app"

Do not use it for single-component requests. Invoke the specific plugin skill instead.

## Quick Start

```text
/power-platform-orchestrator Create a customer portal with login, contact forms, and a ticket dashboard
```

The orchestrator will discover required skills, build a dependency plan, ask for approval, execute phases, validate the project state, and summarize deliverables.

## Entry Points

Use the host-specific command name after installing the marketplace or running the OpenCode installer.

| Host | Command |
|------|---------|
| Claude Code / GitHub Copilot CLI | `/power-platform-orchestrator:power-platform-orchestrator` |
| OpenCode | `/power-platform-orchestrator-power-platform-orchestrator` |

For native plugin development, launch only this plugin with:

```bash
claude --plugin-dir /path/to/power-platform-skills/plugins/power-platform-orchestrator
```

## Project State

Every orchestrated run creates or updates `power-platform-project.json` in the selected project root. This file is the handoff contract between phases and records:

- The selected Power Platform environment ID
- The approved execution phases and dependencies
- Completed, failed, and skipped phase status
- Artifact paths, generated URLs, table names, and other downstream outputs
- The final project status: `completed`, `partial`, or `failed`

Run the validator manually when changing the state schema:

```bash
node plugins/power-platform-orchestrator/scripts/validate-orchestration-state.js path/to/power-platform-project.json
```

## Structure

```text
plugins/power-platform-orchestrator/
├── .claude-plugin/plugin.json
├── AGENTS.md
├── agents/orchestrator.md
├── skills/power-platform-orchestrator/SKILL.md
├── references/
│   ├── intent-detection-matrix.md
│   ├── orchestration-patterns.md
│   ├── project-template.md
│   └── skill-manifest.json
├── scripts/
│   ├── generate-skill-manifest.js
│   └── validate-orchestration-state.js
└── hooks/hooks.json
```

## Regenerate Skill Manifest

```bash
node plugins/power-platform-orchestrator/scripts/generate-skill-manifest.js
```

Regenerate this file after adding, removing, or renaming marketplace plugins or user-invocable skills. The generator excludes `power-platform-orchestrator` itself to avoid self-referential plans.

## Related Plugins

| Plugin | Role |
|--------|------|
| `power-pages` | Sites, auth, web API, Dataverse schema, permissions, deployment |
| `canvas-apps` | Canvas Apps for mobile and tablet experiences |
| `code-apps-preview` | React/Vite code apps and connector integration, source folder `plugins/code-apps` |
| `model-apps` | Generative pages for model-driven apps |
| `mcp-apps` | MCP App widgets |
