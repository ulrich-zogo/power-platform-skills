# Orchestration Patterns

This document catalogs common multi-plugin composition patterns for the orchestrator. Use these as starting points when building dependency graphs.

Each pattern includes the scenario, ordered phases, dependencies, parallel opportunities, and expected outputs. Validate exact skill availability against `references/skill-manifest.json` before using a pattern.

## Pattern 1: Site And Auth

Scenario: A simple public or authenticated website.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/create-site` | `power-pages` | Scaffold and build the site |
| 2 | `/setup-auth` | `power-pages` | Add Microsoft Entra ID authentication |
| 3 | `/deploy-site` | `power-pages` | Deploy to Power Pages |

Dependency graph:

```text
create-site -> setup-auth -> deploy-site
```

Parallel opportunities: none.

Expected outputs:

- Phase 1: `sitePath`, `devServerUrl`
- Phase 2: `authConfigured: true`
- Phase 3: `deployedUrl`

## Pattern 2: Site, Data, And Auth

Scenario: A data-driven portal with authenticated users and Dataverse backend.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/setup-datamodel` | `power-pages` | Create Dataverse tables |
| 2 | `/create-site` | `power-pages` | Build the portal |
| 3 | `/setup-auth` | `power-pages` | Configure Microsoft Entra ID |
| 4 | `/integrate-webapi` | `power-pages` | Connect site to Dataverse |
| 5 | `/create-webroles` | `power-pages` | Define access roles |
| 6 | `/audit-permissions` | `power-pages` | Secure table permissions |
| 7 | `/deploy-site` | `power-pages` | Deploy to production |

Dependency graph:

```text
setup-datamodel -> create-site -> setup-auth -> create-webroles -> audit-permissions -> deploy-site
setup-datamodel -> create-site -> integrate-webapi -> audit-permissions
```

Parallel opportunities:

- After `setup-datamodel`, `create-site` can start.
- After `create-site`, `setup-auth` and `integrate-webapi` can run in parallel.
- After `setup-auth`, `create-webroles` can run.
- After `integrate-webapi` and `create-webroles`, `audit-permissions` can run.

Expected outputs:

- Phase 1: `tableNames[]`, `tableSchemas`
- Phase 2: `sitePath`, `framework`
- Phase 3: `authProvider`, `authConfigured`
- Phase 4: `apiEndpoints[]`, `webapiConfigured`
- Phase 5: `webRoles[]`
- Phase 6: `permissionsAuditReport`
- Phase 7: `productionUrl`

## Pattern 3: Full Solution With Portal And Apps

Scenario: A comprehensive solution with a customer-facing portal, an internal Canvas App, and a Code App for admins.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/setup-datamodel` | `power-pages` | Shared Dataverse schema |
| 2 | `/create-site` | `power-pages` | Customer portal |
| 3 | `/generate-canvas-app` | `canvas-apps` | Field worker mobile app |
| 4 | `/create-code-app` | `code-apps-preview` | Admin analytics dashboard |
| 5 | `/setup-auth` | `power-pages` | Portal authentication |
| 6 | `/integrate-webapi` | `power-pages` | Portal data connection |
| 7 | `/add-dataverse` | `code-apps-preview` | Connect admin app to Dataverse |
| 8 | `/deploy-site` | `power-pages` | Deploy portal |
| 9 | `/deploy` | `code-apps-preview` | Deploy admin app |

Dependency graph:

```text
setup-datamodel -> create-site -> setup-auth -> integrate-webapi -> deploy-site
setup-datamodel -> generate-canvas-app
setup-datamodel -> create-code-app -> add-dataverse -> deploy
```

Parallel opportunities:

- After `setup-datamodel`, `create-site`, `generate-canvas-app`, and `create-code-app` can run in parallel.
- After `create-site`, `setup-auth` can start.
- After `create-code-app`, `add-dataverse` can start.
- Portal and Code App deployment can run independently after their own dependencies complete.

Expected outputs:

- Phase 1: `tableNames[]`
- Phase 2: `sitePath`
- Phase 3: `canvasAppPath`, `screenCount`
- Phase 4: `codeAppPath`, `framework`
- Phase 5: `authConfigured`
- Phase 6: `webapiConfigured`
- Phase 7: `dataSourceName`, `generatedServices[]`
- Phase 8: `portalProductionUrl`
- Phase 9: `adminAppUrl`

## Pattern 4: Code App With Connectors

Scenario: A Code App connected to multiple external services.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/create-code-app` | `code-apps-preview` | Scaffold React/Vite app |
| 2 | `/add-dataverse` | `code-apps-preview` | Add Dataverse connector |
| 3 | `/add-sharepoint` | `code-apps-preview` | Add SharePoint connector |
| 4 | `/add-office365` | `code-apps-preview` | Add Outlook connector |
| 5 | `/deploy` | `code-apps-preview` | Deploy to Power Platform |

Dependency graph:

```text
create-code-app -> add-dataverse -> add-sharepoint -> add-office365 -> deploy
```

Connector skills can sometimes run in parallel after `create-code-app`, but run them sequentially unless the user has pre-specified all connector details.

Expected outputs:

- Phase 1: `appPath`, `framework`, `environmentId`
- Phase 2: `dataverseTable`, `generatedModels[]`
- Phase 3: `sharePointSite`, `generatedServices[]`
- Phase 4: `office365Connection`, `generatedServices[]`
- Phase 5: `appUrl`

## Pattern 5: Enhancement Suite

Scenario: Adding independent capabilities to an existing site.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/add-seo` | `power-pages` | Add meta tags, sitemap, and robots.txt |
| 2 | `/add-cloud-flow` | `power-pages` | Integrate Power Automate flows |
| 3 | `/add-server-logic` | `power-pages` | Add server-side API endpoints |
| 4 | `/test-site` | `power-pages` | Run smoke tests |

Dependency graph:

```text
add-seo -> test-site
add-cloud-flow -> test-site
add-server-logic -> test-site
```

Parallel opportunities: `add-seo`, `add-cloud-flow`, and `add-server-logic` are independent and can run in parallel.

Expected outputs:

- Phase 1: `seoFiles[]`
- Phase 2: `flowNames[]`
- Phase 3: `serverLogicFiles[]`
- Phase 4: `testResults`

## Pattern 6: Model-Driven Enhancement

Scenario: Adding a generative page to an existing model-driven app.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/genpage` | `model-apps` | Build and deploy generative page |

Dependency graph:

```text
genpage
```

Expected outputs:

- Phase 1: `pageName`, `deployedUrl`

## Pattern 7: MCP App Widget

Scenario: Generating a visual widget for an MCP tool.

| Phase | Skill | Plugin | Purpose |
|-------|-------|--------|---------|
| 1 | `/generate-mcp-app-ui` | `mcp-apps` | Create HTML widget |

Dependency graph:

```text
generate-mcp-app-ui
```

Expected outputs:

- Phase 1: `widgetPath`, `widgetHtml`

## Cross-Cutting Rules

### Authentication Timing

Authentication should usually run after the site or app exists and before web roles, permission setup, or deployment.

### Data Model First

Most multi-component projects benefit from creating or confirming Dataverse schema first. Power Pages, Canvas Apps, Code Apps, and Web API integration can then share the same table assumptions.

### Deployment Last

Deployment skills should be final because they publish the combined outcome. Do not deploy before configuration, permissions, and validation are complete.

### Environment Consistency

Use one environment ID for all phases. Pass it explicitly to child skills that support environment selection.

### Code Apps Naming

Use `code-apps-preview` as the plugin name. Use `plugins/code-apps` only when referring to the source folder in this repository.

### Code Apps Memory Bank

The Code Apps plugin may use a `memory-bank.md` pattern. When orchestrating Code Apps phases, preserve and update that memory bank across related Code Apps skills.
