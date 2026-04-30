# Power Platform Orchestrator Plugin

A meta-plugin for planning and supervising complete Power Platform solutions that span multiple components. It coordinates other plugins instead of replacing them.

## What This Plugin Is

The orchestrator is responsible for:

1. Understanding the user's high-level business goal
2. Discovering required skills from the generated skill manifest
3. Building an execution plan with dependency ordering
4. Coordinating child skills with shared environment and project context
5. Tracking progress and outputs in `power-platform-project.json`
6. Consolidating a final handoff summary

Use this plugin only when a request spans multiple Power Platform components. For single-component requests, invoke the specific plugin skill directly.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/plugins/power-platform-orchestrator
```

Regenerate the skill manifest after marketplace or skill changes:

```bash
node plugins/power-platform-orchestrator/scripts/generate-skill-manifest.js
```

## Architecture

```text
.claude-plugin/plugin.json              <- Plugin metadata
AGENTS.md                               <- Plugin guidance
agents/
  orchestrator.md                       <- Planning and execution agent
skills/
  power-platform-orchestrator/
    SKILL.md                            <- User-invocable entry point
references/
  intent-detection-matrix.md            <- User intent to skill mapping
  orchestration-patterns.md             <- Dependency and execution patterns
  project-template.md                   <- Project state schema
  skill-manifest.json                   <- Generated skill registry
scripts/
  generate-skill-manifest.js            <- Manifest generator
  validate-orchestration-state.js       <- Project state validator
hooks/
  hooks.json                            <- Lifecycle validation hook
```

## Key Conventions

- Do not duplicate implementation logic from child plugins. Coordinate by invoking their skills.
- Keep all child skills on the same Power Platform environment ID.
- Pass project root, environment ID, and relevant upstream outputs to every child skill.
- Update `power-platform-project.json` after every phase.
- Present a plan for user approval before executing child skills.
- Retry a failed phase once, then ask the user whether to retry, skip, modify the plan, or stop.
- Validate the project state before final handoff.

## Skill Manifest

`references/skill-manifest.json` is generated from `.claude-plugin/marketplace.json` and each plugin's `skills/*/SKILL.md` frontmatter. Do not maintain skill lists manually in the orchestrator workflow.

## Test Scenarios

Use these scenarios to validate changes:

1. Customer portal with Dataverse data, Power Pages site, authentication, and Canvas App dashboard.
2. Employee intranet with Power Pages site, Entra ID auth, web roles, document integration, and audit.
3. Field service solution with Dataverse schema, Canvas App, Code App, connectors, and deploy phase.
4. Single-component request such as "Create a Canvas App" should be routed to the specific skill instead of orchestrated.

## Maintaining This File

Update when orchestration patterns, supported plugins, state schema, or error handling rules change.
