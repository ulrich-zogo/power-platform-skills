# Intent Detection Matrix

This document maps common user request patterns to the skills and components needed. The orchestrator agent uses it when parsing requirements.

## How To Use

Match the user's request against the patterns below. A single request may match multiple patterns. Combine every matched skill into one dependency graph and use the generated skill manifest as the source of truth for exact plugin and skill names.

## Pattern Matrix

### Portal And Website Patterns

| User says | Skills needed | Plugin | Priority |
|-----------|---------------|--------|----------|
| "portal", "website", "site", "web", "landing page", "public page" | `/create-site` | `power-pages` | High |
| "login", "auth", "authentication", "sign in", "Microsoft login", "Entra ID" | `/setup-auth` | `power-pages` | High |
| "contact form", "form", "survey", "questionnaire" | `/create-site` + `/integrate-webapi` | `power-pages` | High |
| "SEO", "search engine", "Google indexing", "sitemap" | `/add-seo` | `power-pages` | Medium |
| "blog", "articles", "news", "content management" | `/create-site` + `/setup-datamodel` | `power-pages` | Medium |
| "document library", "files", "upload", "download" | `/create-site` + connector skill | `power-pages` + `code-apps-preview` | Medium |

### Data And Backend Patterns

| User says | Skills needed | Plugin | Priority |
|-----------|---------------|--------|----------|
| "database", "tables", "data model", "schema", "Dataverse" | `/setup-datamodel` | `power-pages` | High |
| "API", "connect to data", "fetch data", "CRUD" | `/integrate-webapi` | `power-pages` | High |
| "server-side", "backend logic", "API endpoint", "webhook" | `/add-server-logic` | `power-pages` | Medium |
| "cloud flow", "automation", "Power Automate", "workflow" | `/add-cloud-flow` | `power-pages` | Medium |
| "sample data", "demo data", "seed records", "test data" | `/add-sample-data` | `power-pages` | Low |
| "permissions", "security", "who can access", "roles" | `/create-webroles` + `/audit-permissions` | `power-pages` | Medium |

### App Patterns

| User says | Skills needed | Plugin | Priority |
|-----------|---------------|--------|----------|
| "mobile app", "tablet app", "phone app", "touch-friendly" | `/generate-canvas-app` | `canvas-apps` | High |
| "dashboard", "admin panel", "manager view", "analytics" | `/generate-canvas-app` or `/create-code-app` | `canvas-apps` or `code-apps-preview` | High |
| "React app", "Vite app", "custom app", "code app" | `/create-code-app` | `code-apps-preview` | High |
| "model-driven", "form view", "entity page", "genux" | `/genpage` | `model-apps` | High |
| "AI widget", "MCP app", "widget", "visual component" | `/generate-mcp-app-ui` | `mcp-apps` | Medium |

### Connector Patterns

| User says | Skills needed | Plugin | Priority |
|-----------|---------------|--------|----------|
| "send email", "Outlook", "calendar", "inbox" | `/add-office365` | `code-apps-preview` | Medium |
| "Teams", "chat", "channel", "message" | `/add-teams` | `code-apps-preview` | Medium |
| "SharePoint", "lists", "document library" | `/add-sharepoint` | `code-apps-preview` | Medium |
| "Excel", "spreadsheet", "CSV" | `/add-excel` | `code-apps-preview` | Medium |
| "OneDrive", "file storage", "cloud files" | `/add-onedrive` | `code-apps-preview` | Medium |
| "Azure DevOps", "work items", "bugs", "pipelines" | `/add-azuredevops` | `code-apps-preview` | Medium |
| "Copilot", "AI agent", "chatbot" | `/add-mcscopilot` | `code-apps-preview` | Medium |
| "custom connector", "API integration", "third-party" | `/add-connector` | `code-apps-preview` | Medium |

### Deployment Patterns

| User says | Skills needed | Plugin | Priority |
|-----------|---------------|--------|----------|
| "deploy", "publish", "go live", "production" | `/deploy-site` or `/deploy` | `power-pages` or `code-apps-preview` | High |
| "test", "validate", "smoke test", "check" | `/test-site` | `power-pages` | Medium |
| "activate", "provision", "turn on" | `/activate-site` | `power-pages` | Medium |

## Multi-Component Combinations

### Customer Portal

Use these skills when the user asks for a customer-facing portal with forms or account data:

- `/create-site` for the portal
- `/setup-datamodel` for contacts, accounts, or inquiries
- `/setup-auth` for customer login
- `/integrate-webapi` for forms and Dataverse CRUD
- `/add-seo` when public visibility matters

### Employee Intranet

Use these skills when the user asks for an internal company portal:

- `/create-site` for the internal portal
- `/setup-auth` for Microsoft Entra ID
- `/setup-datamodel` for announcements or documents
- `/create-webroles` for employee and manager access
- `/add-cloud-flow` for notifications or approvals

### Field Service App

Use these skills when the user asks for technicians, work orders, or field operations:

- `/setup-datamodel` for work orders and customers
- `/generate-canvas-app` for the mobile app
- `/create-code-app` for the admin dashboard when requested
- `/add-dataverse` for Code App typed Dataverse access
- `/add-office365` for email notifications when requested

### Event Management System

Use these skills when the user asks for events, registrations, or attendee check-in:

- `/setup-datamodel` for events, registrations, and attendees
- `/create-site` for the event website
- `/generate-canvas-app` for check-in staff when requested
- `/setup-auth` for attendee login when required
- `/add-cloud-flow` for confirmation emails
- `/add-seo` for event discoverability

### Partner Hub

Use these skills when the user asks for a partner or vendor portal:

- `/create-site` for the partner portal
- `/setup-auth` for partner login
- `/setup-datamodel` for partners, opportunities, or documents
- `/add-sharepoint` for document collaboration when requested
- `/add-teams` for communication when requested
- `/audit-permissions` for data security review

## Negative Signals

If the user's request matches only one of these patterns, do not orchestrate. Invoke the specific skill directly.

| User says | Direct skill |
|-----------|--------------|
| "Create a Canvas App for X" | `/generate-canvas-app` |
| "Build a Code App for X" | `/create-code-app` |
| "Deploy my site" | `/deploy-site` |
| "Add SEO to my site" | `/add-seo` |
| "Fix bug in X" | `/report-issue` |
| "Generate a widget" | `/generate-mcp-app-ui` |

## Ambiguity Resolution

When the user's request is ambiguous, apply these rules:

1. Default to completeness when the user asks for a full solution.
2. Ask one concise clarification batch when "app" could mean Canvas App or Code App.
3. Infer external users as portal plus authentication.
4. Infer internal users as app plus connectors unless a public site is requested.
5. Infer Dataverse when the request mentions forms, submissions, records, or CRUD.
6. Propose a minimal viable plan when the request is vague, then wait for plan approval.
