#!/usr/bin/env ts-node
/*
 * SOP Ingestion Script
 * Scans data/raw/sops/ subdirectories, parses Markdown/TXT files into a canonical
 * structure suitable for Strapi upsert and AI indexing.
 *
 * Output:
 *  - data/processed/sops/sops.jsonl (one JSON object per SOP)
 *  - data/processed/sops/sop-manifest.json (hashes + counts)
 *
 * Exit Codes: 0 success, 2 validation issues, 3 IO failure
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface RawSOPParsed {
  slug: string;
  title: string;
  category: string; // Mapped to Strapi enumeration if possible
  subcategory?: string;
  status: 'draft' | 'active' | 'deprecated';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: number;
  version: number;
  tags?: string[];
  content: string; // full markdown content
  summary?: string; // first 160 chars stripped of markdown
  steps?: string[]; // extracted numbered steps
  sourcePath: string;
  hash: string; // sha256 of content
}

interface ManifestEntry {
  slug: string;
  path: string;
  hash: string;
  version: number;
  status: string;
}

interface Manifest {
  generatedAt: string;
  total: number;
  entries: ManifestEntry[];
  categories: Record<string, number>;
}

const RAW_ROOT = path.resolve('data/raw/sops');
const OUT_FILE = path.resolve('data/processed/sops/sops.jsonl');
const MANIFEST_FILE = path.resolve('data/processed/sops/sop-manifest.json');

const VALID_CATEGORIES = new Set(['Machines', 'Processes', 'Troubleshooting', 'Safety']);

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function stripMarkdown(text: string): string {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+\s?([^\n]+)/g, '$1')
    .replace(/>\s?([^\n]+)/g, '$1')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

function parseFrontMatter(content: string): Record<string, any> {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = content.substring(3, end).trim();
  const lines = block.split(/\r?\n/);
  const data: Record<string, any> = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      try { data[key] = JSON.parse(value); } catch { data[key] = value; }
    } else if (/^\d+$/.test(value)) {
      data[key] = Number(value);
    } else {
      data[key] = value;
    }
  }
  return data;
}

function extractSteps(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const steps: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*(\d{1,3})[.)]\s+(.*)$/);
    if (m) steps.push(m[2].trim());
  }
  return steps;
}

function deriveTitle(content: string, fileName: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fileName.replace(/\.(md|txt)$/i, '').replace(/[-_]/g, ' ');
}

function mapCategory(raw: string): string {
  if (VALID_CATEGORIES.has(raw)) return raw;
  // fallback mapping or tag grouping can be enhanced later
  return 'Processes';
}

function buildSOPObject(fullContent: string, relPath: string, category: string): RawSOPParsed {
  const frontMatter = parseFrontMatter(fullContent);
  // Remove front-matter from content if present
  let content = fullContent;
  if (Object.keys(frontMatter).length) {
    const fmEnd = fullContent.indexOf('\n---', 3);
    content = fullContent.substring(fmEnd + 4).trim();
  }
  const fileName = path.basename(relPath);
  const title = deriveTitle(content, fileName);
  const slug = slugify(title);
  const hash = sha256(fullContent);
  const summary = stripMarkdown(content).substring(0, 160);
  const steps = extractSteps(content);

  return {
    slug,
    title,
    category: mapCategory(category),
    status: (frontMatter.status as any) || 'draft',
    difficulty: frontMatter.difficulty as any,
    estimatedTime: typeof frontMatter.estimatedTime === 'number' ? frontMatter.estimatedTime : undefined,
    version: typeof frontMatter.version === 'number' ? frontMatter.version : 1,
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : undefined,
    content,
    summary,
    steps: steps.length ? steps : undefined,
    sourcePath: relPath,
    hash,
  };
}

function main() {
  const start = Date.now();
  const errors: string[] = [];
  const entries: RawSOPParsed[] = [];

  if (!fs.existsSync(RAW_ROOT)) {
    console.error('ERROR: raw SOP directory missing:', RAW_ROOT);
    process.exit(3);
  }

  const categories = fs.readdirSync(RAW_ROOT).filter(d => fs.statSync(path.join(RAW_ROOT, d)).isDirectory());
  for (const cat of categories) {
    const catDir = path.join(RAW_ROOT, cat);
    const files = fs.readdirSync(catDir).filter(f => /\.(md|txt)$/i.test(f));
    for (const file of files) {
      const rel = path.join(cat, file);
      const fullPath = path.join(catDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      try {
        const sop = buildSOPObject(content, rel, cat);
        entries.push(sop);
      } catch (e: any) {
        errors.push(`Failed parsing ${rel}: ${e.message}`);
      }
    }
  }

  // Validation (basic)
  for (const e of entries) {
    if (!e.title) errors.push(`Missing title for slug=${e.slug}`);
    if (!e.category) errors.push(`Missing category for slug=${e.slug}`);
  }

  console.log('--- SOP Ingestion Summary ---');
  console.log(`Categories discovered: ${categories.length}`);
  console.log(`Files processed:       ${entries.length}`);
  console.log(`Errors:                ${errors.length}`);
  console.log(`Duration ms:           ${Date.now() - start}`);

  if (errors.length) {
    errors.slice(0, 10).forEach(e => console.error('ERROR:', e));
  }

  // Abort on validation errors
  if (errors.length) process.exit(2);

  // Write outputs
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const jsonl = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(OUT_FILE, jsonl, 'utf8');

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    entries: entries.map(e => ({ slug: e.slug, path: e.sourcePath, hash: e.hash, version: e.version, status: e.status })),
    categories: entries.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {}),
  };
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  console.log(`Wrote ${entries.length} SOPs to ${OUT_FILE}`);
  console.log(`Manifest written to ${MANIFEST_FILE}`);
  process.exit(0);
}

if (require.main === module) {
  main();
}
