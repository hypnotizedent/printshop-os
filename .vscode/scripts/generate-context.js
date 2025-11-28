#!/usr/bin/env node
/**
 * Session Context Generator
 * Generates .vscode/session-state.json on workspace open
 * 
 * This enables Copilot to instantly understand project state
 * without needing extensive prompting each session.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');

function safeExec(cmd, fallback = 'N/A') {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return fallback;
  }
}

function getDirectories(dir) {
  try {
    return fs.readdirSync(path.join(ROOT, dir))
      .filter(f => fs.statSync(path.join(ROOT, dir, f)).isDirectory());
  } catch {
    return [];
  }
}

function getFileIfExists(filePath) {
  try {
    const content = fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
    // Return first 500 chars as summary
    return content.slice(0, 500) + (content.length > 500 ? '...' : '');
  } catch {
    return null;
  }
}

// Build context object
const context = {
  // Metadata
  generated: new Date().toISOString(),
  project: 'printshop-os',
  description: 'Enterprise print shop management system replacing Printavo',
  
  // Git State
  git: {
    branch: safeExec('git branch --show-current'),
    lastCommit: safeExec('git log -1 --pretty=format:"%h - %s (%cr)"'),
    uncommittedChanges: safeExec('git status --porcelain').split('\n').filter(Boolean).length,
    recentCommits: safeExec('git log -5 --pretty=format:"%h %s"').split('\n'),
  },
  
  // Project Structure
  structure: {
    services: getDirectories('services'),
    strapiContentTypes: getDirectories('printshop-strapi/src/api'),
    frontendPages: getDirectories('frontend/src/pages'),
    frontendComponents: getDirectories('frontend/src/components'),
  },
  
  // Key Documentation (for quick reference)
  keyDocs: [
    'PROJECT_OVERVIEW.md',
    'ARCHITECTURE.md',
    'SERVICE_DIRECTORY.md',
  ],
  
  // Recent Changes (last 5 commits worth of files)
  recentlyChanged: safeExec('git diff --name-only HEAD~5 2>/dev/null', '')
    .split('\n')
    .filter(Boolean)
    .slice(0, 20),
  
  // Environment Info
  environment: {
    nodeVersion: safeExec('node --version'),
    npmVersion: safeExec('npm --version'),
    dockerRunning: safeExec('docker info 2>/dev/null && echo "yes"', 'no').includes('yes') ? 'yes' : 'no',
  },
  
  // Service Status (ports in use)
  activeServices: {
    strapi: safeExec('lsof -i :1337 2>/dev/null && echo "running"', 'stopped').includes('running') ? 'running' : 'stopped',
    frontend: safeExec('lsof -i :5173 2>/dev/null && echo "running"', 'stopped').includes('running') ? 'running' : 'stopped',
    redis: safeExec('lsof -i :6379 2>/dev/null && echo "running"', 'stopped').includes('running') ? 'running' : 'stopped',
  },
  
  // Quick Stats
  stats: {
    totalFiles: parseInt(safeExec('find . -type f -name "*.ts" -o -name "*.tsx" | wc -l', '0')),
    totalTests: parseInt(safeExec('find . -type f -name "*.test.ts" -o -name "*.spec.ts" | wc -l', '0')),
  },
  
  // Integration Points
  integrations: {
    homelab: {
      path: '../homelab/homelab-infrastructure',
      dockerCompose: 'stacks/business-stack/printshop-os/docker-compose.yml',
    },
    externalAPIs: ['Stripe', 'SendGrid', 'EasyPost', 'Printavo'],
  },
  
  // Current Priorities (parsed from SERVICE_DIRECTORY.md recent updates)
  priorities: [
    'Customer Journey Implementation (Stripe, SendGrid, Quotes)',
    'Homelab Migration (730XD deployment)',
    'Session Context System (this file)',
  ],
};

// Write session state
const outputPath = path.join(ROOT, '.vscode/session-state.json');
fs.writeFileSync(outputPath, JSON.stringify(context, null, 2));

// Append to session history (JSONL format for immutable log)
const historyPath = path.join(ROOT, 'data/session-history.jsonl');
const historyDir = path.dirname(historyPath);
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// Add session entry with minimal data for history
const historyEntry = {
  timestamp: context.generated,
  branch: context.git.branch,
  lastCommit: context.git.lastCommit,
  uncommittedChanges: context.git.uncommittedChanges,
  strapiTypes: context.structure.strapiContentTypes.length,
  activeServices: context.activeServices,
};
fs.appendFileSync(historyPath, JSON.stringify(historyEntry) + '\n');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  📋 PrintShop OS Session Context Generated                   ║
╠══════════════════════════════════════════════════════════════╣
║  Branch: ${context.git.branch.padEnd(49)}║
║  Last Commit: ${context.git.lastCommit.slice(0, 44).padEnd(44)}║
║  Services: ${context.structure.services.length} | Content Types: ${context.structure.strapiContentTypes.length}              ║
║  Strapi: ${context.activeServices.strapi.padEnd(10)} | Frontend: ${context.activeServices.frontend.padEnd(10)}       ║
║  📜 Session history appended to data/session-history.jsonl   ║
╚══════════════════════════════════════════════════════════════╝
`);

// Also output a CONTEXT.md for human readability
const contextMd = `# Session Context - ${new Date().toLocaleDateString()}

> Auto-generated. Do not edit manually.

## Git Status
- **Branch:** ${context.git.branch}
- **Last Commit:** ${context.git.lastCommit}
- **Uncommitted:** ${context.git.uncommittedChanges} files

## Project Structure
- **Services:** ${context.structure.services.join(', ')}
- **Strapi Types:** ${context.structure.strapiContentTypes.join(', ')}

## Active Services
| Service | Status |
|---------|--------|
| Strapi (1337) | ${context.activeServices.strapi} |
| Frontend (5173) | ${context.activeServices.frontend} |
| Redis (6379) | ${context.activeServices.redis} |

## Current Priorities
${context.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Key Docs to Read
${context.keyDocs.map(d => `- [${d}](${d})`).join('\n')}
`;

fs.writeFileSync(path.join(ROOT, '.vscode/CONTEXT.md'), contextMd);
