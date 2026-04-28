# Project State Template

This document defines the schema for `power-platform-project.json`, the central state file that tracks progress and outputs for an orchestrated Power Platform project.

## File Location

`[PROJECT_ROOT]/power-platform-project.json`

## Required Shape

```json
{
  "projectName": "Contoso Customer Portal",
  "createdAt": "2026-04-25T14:30:00.000Z",
  "environmentId": "32a51012-8a9e-4e59-9f8c-123456789abc",
  "status": "planning",
  "projectRoot": "/home/user/projects/contoso-customer-portal",
  "phases": [],
  "artifacts": {},
  "userRequirements": {
    "originalRequest": "Build a complete customer portal with Microsoft login",
    "solutionType": "Customer Portal",
    "targetUsers": "Mixed",
    "components": ["Website / Portal", "Canvas App"],
    "authentication": "Microsoft Entra ID",
    "features": ["Contact forms", "Data storage"]
  }
}
```

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | Yes | Human-readable project name |
| `createdAt` | string | Yes | ISO 8601 timestamp of project creation |
| `environmentId` | string or null | Yes | Shared Power Platform environment ID |
| `status` | string | Yes | `planning`, `in_progress`, `completed`, `partial`, or `failed` |
| `projectRoot` | string | Yes | Absolute path to the project root directory |
| `phases` | array | Yes | Ordered execution phases |
| `artifacts` | object | Yes | Consolidated artifact locations by plugin or component type |
| `userRequirements` | object | Yes | Original request and wizard answers |

## Phase Fields

Every phase must include:

```json
{
  "id": "phase-1",
  "skill": "/setup-datamodel",
  "plugin": "power-pages",
  "status": "pending",
  "dependsOn": [],
  "projectPath": null,
  "outputs": {},
  "startedAt": null,
  "completedAt": null,
  "error": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique phase identifier |
| `skill` | string | Yes | Skill path or generated command name |
| `plugin` | string | Yes | Plugin name from `skill-manifest.json` |
| `status` | string | Yes | `pending`, `in_progress`, `completed`, `failed`, or `skipped` |
| `dependsOn` | array | Yes | Phase IDs that must finish before this phase runs |
| `projectPath` | string or null | No | Path created or owned by this phase |
| `outputs` | object | Yes | Minimal values needed by downstream phases |
| `startedAt` | string or null | No | ISO timestamp for phase start |
| `completedAt` | string or null | No | ISO timestamp for phase completion |
| `error` | string or null | No | Human-readable error summary if the phase failed |

## Artifact Registry

Use plugin names as artifact keys where possible:

```json
{
  "artifacts": {
    "power-pages": ["sites/customer-portal"],
    "canvas-apps": ["apps/field-check-in"],
    "code-apps-preview": ["apps/admin-dashboard"],
    "model-apps": [],
    "mcp-apps": [],
    "dataverse": ["contacts", "inquiries"]
  }
}
```

## Complete Example

```json
{
  "projectName": "Contoso Customer Portal",
  "createdAt": "2026-04-25T14:30:00.000Z",
  "environmentId": "32a51012-8a9e-4e59-9f8c-123456789abc",
  "status": "completed",
  "projectRoot": "/home/user/projects/contoso-customer-portal",
  "phases": [
    {
      "id": "phase-1",
      "skill": "/setup-datamodel",
      "plugin": "power-pages",
      "status": "completed",
      "dependsOn": [],
      "projectPath": null,
      "outputs": {
        "tableNames": ["contacts", "inquiries"]
      },
      "startedAt": "2026-04-25T14:31:00.000Z",
      "completedAt": "2026-04-25T14:35:00.000Z",
      "error": null
    },
    {
      "id": "phase-2",
      "skill": "/create-site",
      "plugin": "power-pages",
      "status": "completed",
      "dependsOn": ["phase-1"],
      "projectPath": "sites/contoso-portal",
      "outputs": {
        "framework": "react",
        "devServerUrl": "http://localhost:5173"
      },
      "startedAt": "2026-04-25T14:36:00.000Z",
      "completedAt": "2026-04-25T14:50:00.000Z",
      "error": null
    }
  ],
  "artifacts": {
    "power-pages": ["sites/contoso-portal"],
    "canvas-apps": [],
    "code-apps-preview": [],
    "dataverse": ["contacts", "inquiries"]
  },
  "userRequirements": {
    "originalRequest": "Build a complete customer portal with Microsoft login",
    "solutionType": "Customer Portal",
    "targetUsers": "Mixed",
    "components": ["Website / Portal", "Canvas App"],
    "authentication": "Microsoft Entra ID",
    "features": ["Contact forms", "Data storage"]
  }
}
```

## Conventions

- Create the state file before invoking child skills.
- Update the matching phase after every child skill attempt.
- Keep `projectPath` relative to `projectRoot` when practical.
- Store only downstream-relevant values in `outputs`.
- Store human-readable summaries in `error`, not full stack traces.
- Keep dependency references as phase IDs.
- Set final status to `completed` only when every phase completed.
