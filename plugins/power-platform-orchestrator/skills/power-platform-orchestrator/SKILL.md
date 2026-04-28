---
name: power-platform-orchestrator
description: >-
  Orchestrates multi-component Power Platform projects by coordinating skills across
  power-pages, canvas-apps, code-apps-preview, model-apps, and mcp-apps. Use when the
  user wants a complete solution that spans multiple Power Platform components, or
  when the best approach requires combining capabilities from different plugins.
author: Microsoft Corporation
user-invocable: true
argument-hint: Describe the complete solution you want to build
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion, Skill, EnterPlanMode, ExitPlanMode
model: opus
---

# Power Platform Orchestrator

Build a complete, multi-component Power Platform solution from a single request.

**Initial request:** $ARGUMENTS

## Overview

This skill is the top-level entry point for orchestrated Power Platform projects. It coordinates skills from multiple plugins to deliver cohesive solutions that no single plugin could build alone.

Use this skill when the request spans multiple components such as a Power Pages site, Dataverse data model, Canvas App, Code App, authentication, permissions, cloud flows, or deployment.

Do not use this skill for single-component requests. Route those directly to the relevant skill.

## Phase 0 - Determine Environment

Before planning, determine the target Power Platform environment. This environment is shared by every component in the orchestrated project.

Check existing PAC authentication:

```bash
pwsh -NoProfile -Command "pac auth list"
```

If no auth profiles exist, proceed with system credentials. If multiple profiles exist, do not clear them automatically. Show the available profiles and environments, then ask the user which environment to use.

List environments:

```bash
pwsh -NoProfile -Command "pac env list"
```

Show up to 10 environments and record the selected environment ID as `ENVIRONMENT_ID`. Pass this value to every child skill that needs it.

Create progress tracking with the host's task tracking mechanism if available. Do not invent unsupported tool names. If no task tracker exists, use `power-platform-project.json` as the authoritative progress record.

## Phase 1 - Gather Requirements

Understand what the user wants to build and identify which components are needed.

If `$ARGUMENTS` is vague or missing, ask:

> What would you like to build? Describe what it does, who uses it, and what problem it solves.

Ask all applicable follow-up questions in one `AskUserQuestion` call:

| Question | Header | When to ask | Options |
|----------|--------|-------------|---------|
| What should the project be called? | Project Name | Always | Free text |
| What type of solution is this? | Solution Type | If unclear | Customer Portal, Internal Dashboard, Business App Suite, Landing Page + Apps |
| Who are the primary users? | Target Users | If unclear | Internal employees, External customers, Partners/Vendors, Mixed audiences |
| Which components do you need? | Components | If unclear | Website / Portal, Canvas App, Code App, Data Model, Model-driven page, MCP App |
| Do you need authentication? | Authentication | If unclear | Microsoft Entra ID, Other provider, No public access needed |
| Any specific features? | Features | If unclear | Contact forms, Document library, Search, Notifications, Analytics, SEO, Cloud flows |
| Where should the project be created? | Location | Always | Current directory, New folder in current directory, Other directory |

Parse `$ARGUMENTS` first and skip questions that are already answered.

## Phase 2 - Create Project Structure

Initialize the project directory and state file.

Resolve the project location:

| Choice | Result |
|--------|--------|
| Current directory | `PROJECT_ROOT = <cwd>` |
| New folder in current directory | `PROJECT_ROOT = <cwd>/<project-name-slug>` |
| Other directory | Verify or create the provided path |

Create these directories under `PROJECT_ROOT` as needed:

```bash
mkdir -p "[PROJECT_ROOT]/sites" "[PROJECT_ROOT]/apps" "[PROJECT_ROOT]/data" "[PROJECT_ROOT]/docs"
```

Write `[PROJECT_ROOT]/power-platform-project.json` using the schema in `${CLAUDE_PLUGIN_ROOT}/references/project-template.md`:

```json
{
  "projectName": "[project name]",
  "createdAt": "[ISO timestamp]",
  "environmentId": "[ENVIRONMENT_ID]",
  "status": "planning",
  "projectRoot": "[absolute PROJECT_ROOT]",
  "phases": [],
  "artifacts": {},
  "userRequirements": {
    "originalRequest": "$ARGUMENTS",
    "solutionType": "[type]",
    "targetUsers": "[users]",
    "components": ["[component list]"],
    "authentication": "[auth choice]",
    "features": ["[feature list]"]
  }
}
```

Do not proceed until the state file exists and the project directories exist.

## Phase 3 - Invoke Orchestrator Agent

Hand off planning and execution to the orchestrator agent.

Use the agent type installed for this plugin: `orchestrator` in Claude/Copilot plugin mode, or `power-platform-orchestrator-orchestrator` in OpenCode wrapper mode.

Prompt the agent with:

```text
You are the orchestrator agent. Build a complete Power Platform project for the following requirements.

User Request: $ARGUMENTS

Wizard Answers:
- Project name: [name]
- Solution type: [type]
- Target users: [users]
- Components needed: [list]
- Authentication: [choice]
- Features: [list]

Shared Context:
- Environment ID: [ENVIRONMENT_ID]
- Working directory (project root): [absolute PROJECT_ROOT]
- Plugin root: ${CLAUDE_PLUGIN_ROOT}

Instructions:
1. Read `${CLAUDE_PLUGIN_ROOT}/references/skill-manifest.json` to discover available skills.
2. Read `${CLAUDE_PLUGIN_ROOT}/references/intent-detection-matrix.md` and `${CLAUDE_PLUGIN_ROOT}/references/orchestration-patterns.md`.
3. Analyze requirements and identify required skills.
4. Build a dependency graph and execution plan.
5. Present the plan via plan mode and get approval.
6. Execute phases sequentially and in parallel per the approved plan.
7. Update `[PROJECT_ROOT]/power-platform-project.json` after each phase.
8. Handle errors using retry-once plus explicit recovery choice.
9. Run project state validation before final summary.
10. Return a consolidated summary and final project state.
```

Wait for the orchestrator agent to finish. Do not interrupt the agent while it is waiting for plan approval or executing phases.

## Phase 4 - Verify Project State

Run the validator against the final project state file:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-orchestration-state.js" "[PROJECT_ROOT]/power-platform-project.json"
```

If validation fails, read the errors, correct the state file if the issue is mechanical, and rerun validation. If validation reveals a failed child phase, present a partial summary and recovery options.

The state file is valid only when:

1. Required top-level fields exist.
2. Every phase has an ID, skill, plugin, status, dependencies, and outputs object.
3. Dependencies reference existing phase IDs.
4. Overall project status matches phase outcomes.
5. Artifact paths are recorded for completed component phases when available.

## Phase 5 - Consolidate And Summarize

Read the validated `power-platform-project.json` and present a concise unified summary:

```text
Power Platform Project Complete: [Project Name]
Environment: [environment name/ID]
Project Root: [PROJECT_ROOT]

Components Built:
- [Skill Name] - [brief status]

Artifacts:
- [artifact path]

Next Steps:
- [suggested enhancement]
```

Suggest enhancements based on gaps:

| Completed without | Suggest |
|-------------------|---------|
| `create-site` without `add-seo` | `/add-seo` |
| `setup-auth` without `create-webroles` | `/create-webroles` |
| `setup-datamodel` without `audit-permissions` | `/audit-permissions` |
| `create-site` without `deploy-site` | `/deploy-site` |
| Code App created but not deployed | `/deploy` |

## Phase 6 - Project Handoff

Confirm the location of `power-platform-project.json`, explain that each component can be enhanced later by invoking its specific skill from the component directory, and ask whether the user wants to add anything else.

Use `AskUserQuestion`:

| Question | Header | Options |
|----------|--------|---------|
| Would you like to add anything else to the project? | Enhancements | Yes, add more; No, project is complete |

If yes, identify the additional skills and return to the planning logic with updated requirements.

## Error Handling

If the orchestrator agent fails or returns an error:

1. Read the current `power-platform-project.json`.
2. Present completed, failed, and skipped phases.
3. Ask the user what to do next.

| Question | Header | Options |
|----------|--------|---------|
| The orchestration encountered an issue. What would you like to do? | Recovery | Retry failed phases, Continue without failed phases, Start over with a new plan, Stop and investigate manually |

If a child skill fails, the orchestrator agent retries once. If the retry fails, it records the phase as `failed`, asks for recovery choice, and compensates downstream phases that depend on the failed output.

## Progress Tracking

Track these milestones with the host task tracker when available, and always mirror them in the project state file:

| # | Milestone | Description |
|---|-----------|-------------|
| 1 | Determine environment | Select a single Power Platform environment |
| 2 | Gather requirements | Capture user intent and component needs |
| 3 | Create project structure | Initialize directories and project state |
| 4 | Plan and approve | Build and approve the dependency graph |
| 5 | Execute phases | Run child skills in dependency order |
| 6 | Verify state | Validate `power-platform-project.json` |
| 7 | Consolidate and summarize | Present final deliverables and next steps |

Begin with Phase 0.
