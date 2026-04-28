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

## Related Plugins

| Plugin | Role |
|--------|------|
| `power-pages` | Sites, auth, web API, Dataverse schema, permissions, deployment |
| `canvas-apps` | Canvas Apps for mobile and tablet experiences |
| `code-apps-preview` | React/Vite code apps and connector integration, source folder `plugins/code-apps` |
| `model-apps` | Generative pages for model-driven apps |
| `mcp-apps` | MCP App widgets |
