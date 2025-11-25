#!/usr/bin/env ts-node
/*
 * Seed Colors into Strapi CMS
 * Requires: STRAPI_URL (default http://localhost:1337), STRAPI_API_TOKEN (Admin API Token)
 * Usage:
 *  node services/supplier-sync/scripts/seed_colors.ts \
 *    --file data/processed/colors/colors.jsonl \
 *    --concurrency 4 \
 *    --dry-run
 */

import * as fs from 'fs';
import * as readline from 'readline';

interface Args { file?: string; concurrency?: number; dryRun?: boolean; }
function parseArgs(argv: string[]): Args {
  const args: Args = { concurrency: 4 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN; // Strapi Admin API token (Settings -> API Tokens)

interface ColorRecord {
  slug: string;
  name: string;
  medium: string;
  vendor: string;
  hex: string;
  finish?: string;
  tags?: string[];
  pantone?: string;
  usageConstraints?: unknown;
  similar?: string[];
  meta?: unknown;
}

async function fetchExistingBatch(slugs: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const CHUNK = 50;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const subset = slugs.slice(i, i + CHUNK);
    const url = `${STRAPI_URL}/api/colors?filters[slug][$in]=${encodeURIComponent(subset.join(','))}&pagination[pageSize]=${subset.length}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`Batch fetch failed (${res.status}) subset size=${subset.length}`);
    const json: any = await res.json();
    for (const entry of (json.data || [])) {
      map.set(entry.attributes.slug, entry.id);
    }
  }
  return map;
}

async function createColor(record: ColorRecord) {
  const res = await fetch(`${STRAPI_URL}/api/colors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ data: record })
  });
  if (!res.ok) throw new Error(`Create failed (${res.status}) slug=${record.slug}`);
}

async function updateColor(id: number, record: ColorRecord) {
  const res = await fetch(`${STRAPI_URL}/api/colors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ data: record })
  });
  if (!res.ok) throw new Error(`Update failed (${res.status}) slug=${record.slug}`);
}

async function seed(file: string, concurrency: number, dryRun: boolean) {
  const stream = fs.createReadStream(file, 'utf8');
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const queue: Array<() => Promise<void>> = [];
  let processed = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;
  const start = Date.now();
  const records: ColorRecord[] = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    records.push(JSON.parse(line) as ColorRecord);
  }

  // Allow dry-run without token; enforce token only when performing writes
  if (!TOKEN && !dryRun) {
    console.error('ERROR: STRAPI_API_TOKEN not set (required for non-dry-run)');
    process.exit(3);
  }

  // Prefetch existing IDs in batch when not dry-run and token present
  let existingMap: Map<string, number> = new Map();
  if (!dryRun && TOKEN) {
    try {
      existingMap = await fetchExistingBatch(records.map(r => r.slug));
    } catch (e: any) {
      console.error('WARN: Batch prefetch failed, proceeding without cache:', e.message);
    }
  }

  for (const parsed of records) {
    queue.push(async () => {
      try {
        processed++;
        if (dryRun) return; // skip network in dry-run
        const existingId = existingMap.get(parsed.slug);
        if (existingId) {
          await updateColor(existingId, parsed);
          updated++;
        } else {
          await createColor(parsed);
          created++;
        }
      } catch (e: any) {
        failed++;
        console.error('Seed error:', e.message);
      }
    });
  }

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      await job();
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  const durationMs = Date.now() - start;
  console.log('--- Color Seeding Summary ---');
  console.log(`File:        ${file}`);
  console.log(`Processed:   ${processed}`);
  console.log(`Created:     ${created}`);
  console.log(`Updated:     ${updated}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Dry Run:     ${dryRun}`);
  console.log(`Duration:    ${durationMs} ms`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('ERROR: --file required');
    process.exit(3);
  }
  if (!fs.existsSync(args.file)) {
    console.error('ERROR: file not found:', args.file);
    process.exit(3);
  }
  await seed(args.file, args.concurrency || 4, !!args.dryRun);
}

if (require.main === module) {
  main();
}
