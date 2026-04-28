#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VALID_PROJECT_STATUSES = new Set(['planning', 'in_progress', 'completed', 'partial', 'failed']);
const VALID_PHASE_STATUSES = new Set(['pending', 'in_progress', 'completed', 'failed', 'skipped']);
const REQUIRED_TOP_LEVEL_FIELDS = [
  'projectName',
  'createdAt',
  'environmentId',
  'status',
  'projectRoot',
  'phases',
  'artifacts',
  'userRequirements'
];
const REQUIRED_PHASE_FIELDS = ['id', 'skill', 'plugin', 'status', 'dependsOn', 'outputs'];

function usage() {
  process.stdout.write('Usage: node scripts/validate-orchestration-state.js [path/to/power-platform-project.json]\n');
  process.stdout.write('When no path is provided, the script supports hook input on stdin and validates power-platform-project.json in the current directory if present.\n');
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

function validateDependencies(phases, errors) {
  const ids = new Set();
  for (const phase of phases) {
    if (ids.has(phase.id)) {
      errors.push(`Duplicate phase id: ${phase.id}`);
    }
    ids.add(phase.id);
  }

  const graph = new Map(phases.map((phase) => [phase.id, phase.dependsOn || []]));
  for (const phase of phases) {
    for (const dependency of phase.dependsOn || []) {
      if (!ids.has(dependency)) {
        errors.push(`Phase ${phase.id} depends on missing phase ${dependency}`);
      }
      if (dependency === phase.id) {
        errors.push(`Phase ${phase.id} depends on itself`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(id, pathStack) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`Dependency cycle detected: ${pathStack.concat(id).join(' -> ')}`);
      return;
    }
    visiting.add(id);
    for (const dependency of graph.get(id) || []) {
      if (graph.has(dependency)) {
        visit(dependency, pathStack.concat(id));
      }
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of graph.keys()) {
    visit(id, []);
  }
}

function validateState(state) {
  const errors = [];

  if (!isObject(state)) {
    return ['Project state must be a JSON object'];
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in state)) {
      errors.push(`Missing required top-level field: ${field}`);
    }
  }

  if (typeof state.projectName !== 'string' || state.projectName.trim() === '') {
    errors.push('projectName must be a non-empty string');
  }
  if (typeof state.createdAt !== 'string' || Number.isNaN(Date.parse(state.createdAt))) {
    errors.push('createdAt must be a valid ISO timestamp string');
  }
  if (state.environmentId !== null && typeof state.environmentId !== 'string') {
    errors.push('environmentId must be a string or null');
  }
  if (!VALID_PROJECT_STATUSES.has(state.status)) {
    errors.push(`status must be one of: ${Array.from(VALID_PROJECT_STATUSES).join(', ')}`);
  }
  if (typeof state.projectRoot !== 'string' || state.projectRoot.trim() === '') {
    errors.push('projectRoot must be a non-empty string');
  }
  if (!Array.isArray(state.phases)) {
    errors.push('phases must be an array');
  }
  if (!isObject(state.artifacts)) {
    errors.push('artifacts must be an object');
  }
  if (!isObject(state.userRequirements)) {
    errors.push('userRequirements must be an object');
  }

  if (!Array.isArray(state.phases)) {
    return errors;
  }

  for (const [index, phase] of state.phases.entries()) {
    const label = phase && phase.id ? phase.id : `phase at index ${index}`;
    if (!isObject(phase)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    for (const field of REQUIRED_PHASE_FIELDS) {
      if (!(field in phase)) {
        errors.push(`${label} missing required field: ${field}`);
      }
    }

    if (typeof phase.id !== 'string' || phase.id.trim() === '') {
      errors.push(`${label} id must be a non-empty string`);
    }
    if (typeof phase.skill !== 'string' || phase.skill.trim() === '') {
      errors.push(`${label} skill must be a non-empty string`);
    }
    if (typeof phase.plugin !== 'string' || phase.plugin.trim() === '') {
      errors.push(`${label} plugin must be a non-empty string`);
    }
    if (!VALID_PHASE_STATUSES.has(phase.status)) {
      errors.push(`${label} status must be one of: ${Array.from(VALID_PHASE_STATUSES).join(', ')}`);
    }
    if (!Array.isArray(phase.dependsOn)) {
      errors.push(`${label} dependsOn must be an array`);
    }
    if (!isObject(phase.outputs)) {
      errors.push(`${label} outputs must be an object`);
    }
    if (phase.status === 'failed' && (typeof phase.error !== 'string' || phase.error.trim() === '')) {
      errors.push(`${label} failed phases must include an error summary`);
    }
  }

  validateDependencies(state.phases, errors);

  const phaseStatuses = state.phases.map((phase) => phase.status);
  const hasActivePhase = phaseStatuses.some((status) => status === 'pending' || status === 'in_progress');
  const hasFailedPhase = phaseStatuses.includes('failed');
  const hasSkippedPhase = phaseStatuses.includes('skipped');

  if (state.status === 'completed' && phaseStatuses.some((status) => status !== 'completed')) {
    errors.push('Project status completed requires every phase to be completed');
  }
  if (state.status === 'partial' && (!hasFailedPhase && !hasSkippedPhase)) {
    errors.push('Project status partial requires at least one failed or skipped phase');
  }
  if (state.status === 'partial' && hasActivePhase) {
    errors.push('Project status partial cannot have pending or in_progress phases');
  }
  if (state.status === 'failed' && !hasFailedPhase) {
    errors.push('Project status failed requires at least one failed phase');
  }

  return errors;
}

function resolveStatePath(argumentPath) {
  if (argumentPath) {
    return path.resolve(argumentPath);
  }
  return path.join(process.cwd(), 'power-platform-project.json');
}

async function main() {
  const argument = process.argv[2];
  if (argument === '--help' || argument === '-h') {
    usage();
    return 0;
  }

  let shouldValidate = Boolean(argument);
  if (!shouldValidate && !process.stdin.isTTY) {
    const input = await readStdin();
    try {
      const toolInput = JSON.parse(input || '{}');
      const skillName = String(toolInput.name || toolInput.skill || toolInput.tool_name || '');
      shouldValidate = skillName.includes('orchestrator');
    } catch {
      shouldValidate = false;
    }
  }

  const statePath = resolveStatePath(argument);
  if (!fs.existsSync(statePath)) {
    if (argument) {
      process.stderr.write(`Project state file not found: ${statePath}\n`);
      return 1;
    }
    return 0;
  }

  if (!shouldValidate && path.basename(statePath) !== 'power-platform-project.json') {
    return 0;
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (error) {
    process.stderr.write(`Invalid JSON in ${statePath}: ${error.message}\n`);
    return 1;
  }

  const errors = validateState(state);
  if (errors.length > 0) {
    process.stderr.write(`Invalid project state: ${statePath}\n`);
    for (const error of errors) {
      process.stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  process.stdout.write(`Project state valid: ${state.projectName} (${state.status}, ${state.phases.length} phases)\n`);
  return 0;
}

main().then((code) => process.exit(code)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
