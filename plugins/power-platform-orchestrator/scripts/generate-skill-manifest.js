#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '../..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
const OUTPUT_PATH = path.join(PLUGIN_ROOT, 'references', 'skill-manifest.json');
const SELF_PLUGIN_NAME = 'power-platform-orchestrator';

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizeBlock(lines, mode) {
  const nonBlankIndents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)[0].length);
  const minIndent = nonBlankIndents.length > 0 ? Math.min(...nonBlankIndents) : 0;
  const normalized = lines.map((line) => line.slice(Math.min(minIndent, line.length)).replace(/\s+$/g, ''));

  if (mode.startsWith('|')) {
    return normalized.join('\n').trim();
  }

  const paragraphs = [];
  let current = [];
  for (const line of normalized) {
    if (line.trim().length === 0) {
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
      continue;
    }
    current.push(line.trim());
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }
  return paragraphs.join('\n').trim();
}

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const lines = match[1].split(/\r?\n/);
  const result = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\s/.test(line)) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    if (/^[>|]/.test(rawValue)) {
      const block = [];
      while (index + 1 < lines.length && (lines[index + 1].trim() === '' || /^\s/.test(lines[index + 1]))) {
        index += 1;
        block.push(lines[index]);
      }
      result[key] = normalizeBlock(block, rawValue);
      continue;
    }

    result[key] = stripQuotes(rawValue);
  }

  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function discoverSkills(pluginDir) {
  const skillsDir = path.join(pluginDir, 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .map((skillDirectory) => {
      const skillFile = path.join(skillsDir, skillDirectory, 'SKILL.md');
      if (!fs.existsSync(skillFile)) return null;

      const frontmatter = parseYamlFrontmatter(fs.readFileSync(skillFile, 'utf8'));
      if (!frontmatter) return null;

      const userInvocable = String(frontmatter['user-invocable']).toLowerCase() === 'true';
      if (!userInvocable) return null;

      const argumentHint = frontmatter['argument-hint'] || null;
      return {
        name: frontmatter.name || skillDirectory,
        description: frontmatter.description || '',
        userInvocable: true,
        argumentHint,
        arguments: argumentHint,
        skillDirectory
      };
    })
    .filter(Boolean);
}

function pluginDirectoryFromSource(source) {
  const relativeSource = source.replace(/^\.\//, '').replace(/\//g, path.sep);
  return path.resolve(REPO_ROOT, relativeSource);
}

function buildManifest() {
  if (!fs.existsSync(MARKETPLACE_PATH)) {
    throw new Error(`Marketplace manifest not found: ${MARKETPLACE_PATH}`);
  }

  const marketplace = readJson(MARKETPLACE_PATH);
  const plugins = (marketplace.plugins || [])
    .filter((plugin) => plugin.name !== SELF_PLUGIN_NAME)
    .map((plugin) => {
      const pluginDir = pluginDirectoryFromSource(plugin.source || '');
      if (!fs.existsSync(pluginDir)) {
        process.stderr.write(`Skipping missing plugin directory: ${pluginDir}\n`);
        return null;
      }

      const skills = discoverSkills(pluginDir);
      if (skills.length === 0) return null;

      return {
        name: plugin.name,
        description: plugin.description || '',
        category: plugin.category || null,
        tags: Array.isArray(plugin.tags) ? plugin.tags.slice().sort((a, b) => a.localeCompare(b)) : [],
        source: plugin.source,
        skills
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    marketplaceName: marketplace.name || 'power-platform-skills',
    plugins
  };
}

function main() {
  const manifest = buildManifest();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const skillCount = manifest.plugins.reduce((sum, plugin) => sum + plugin.skills.length, 0);
  process.stdout.write(`Skill manifest generated: ${OUTPUT_PATH}\n`);
  process.stdout.write(`Plugins: ${manifest.plugins.length}\n`);
  process.stdout.write(`Total skills: ${skillCount}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
