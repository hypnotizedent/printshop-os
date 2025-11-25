#!/usr/bin/env ts-node
/*
 * SOP Strapi Seeding Script
 * Reads sops.jsonl and upserts into Strapi CMS
 * Exit Codes: 0 success, 2 validation errors, 3 IO failure
 */

import * as fs from 'fs';
import * as readline from 'readline';

interface CanonicalSOP {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: 'draft' | 'active' | 'deprecated';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: number;
  version: number;
  tags?: string[];
  content: string;
  summary?: string;
  steps?: string[];
  machineId?: string;
  related?: string[];
  sourcePath: string;
  sourceHash: string;
  createdAt: string;
  updatedAt: string;
}

interface StrapiSOPData {
  title: string;
  slug: string;
  category: string;
  status?: string;
  difficulty?: string;
  estimatedTime?: number;
  version: number;
  tags?: string[];
  content: string;
  summary?: string;
  steps?: any; // JSON field
  machineId?: string;
  revisionNotes?: string;
}

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchExistingBatch(slugs: string[]): Promise<Map<string, number>> {
  const slugToIdMap = new Map<string, number>();
  if (!STRAPI_API_TOKEN) return slugToIdMap;

  const chunkSize = 50;
  for (let i = 0; i < slugs.length; i += chunkSize) {
    const chunk = slugs.slice(i, i + chunkSize);
    const filters = chunk.map((s, idx) => `filters[slug][$in][${idx}]=${encodeURIComponent(s)}`).join('&');
    const url = `${STRAPI_URL}/api/sops?${filters}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
      });
      if (!res.ok) continue;
      const json: any = await res.json();
      if (json.data && Array.isArray(json.data)) {
        json.data.forEach((item: any) => {
          if (item.attributes?.slug) {
            slugToIdMap.set(item.attributes.slug, item.id);
          }
        });
      }
    } catch (e: any) {
      console.warn(`Prefetch error: ${e.message}`);
    }
  }

  return slugToIdMap;
}

async function createSOP(data: StrapiSOPData): Promise<boolean> {
  const url = `${STRAPI_URL}/api/sops`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch (e: any) {
    console.error(`Create error for ${data.slug}: ${e.message}`);
    return false;
  }
}

async function updateSOP(id: number, data: StrapiSOPData): Promise<boolean> {
  const url = `${STRAPI_URL}/api/sops/${id}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch (e: any) {
    console.error(`Update error for ${data.slug}: ${e.message}`);
    return false;
  }
}

async function seed(filePath: string, concurrency: number, dryRun: boolean) {
  const start = Date.now();
  let processed = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;

  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(3);
  }

  // Read all SOPs first
  const sops: CanonicalSOP[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    try {
      const sop = JSON.parse(line) as CanonicalSOP;
      sops.push(sop);
    } catch (e: any) {
      console.warn(`Parse error: ${e.message}`);
    }
  }

  if (dryRun || !STRAPI_API_TOKEN) {
    console.log('--- SOP Seeding Summary (Dry Run) ---');
    console.log(`File: ${filePath}`);
    console.log(`Total SOPs: ${sops.length}`);
    console.log(`Dry Run: ${dryRun || !STRAPI_API_TOKEN}`);
    if (!STRAPI_API_TOKEN) {
      console.log('⚠️  STRAPI_API_TOKEN not set - run with real token to seed');
    }
    return;
  }

  // Prefetch existing SOPs
  const slugs = sops.map((s) => s.slug);
  const existingMap = await fetchExistingBatch(slugs);

  // Process with concurrency
  for (let i = 0; i < sops.length; i += concurrency) {
    const batch = sops.slice(i, i + concurrency);
    const promises = batch.map(async (sop) => {
      processed++;
      
      const strapiData: StrapiSOPData = {
        title: sop.title,
        slug: sop.slug,
        category: sop.category,
        status: sop.status,
        difficulty: sop.difficulty,
        estimatedTime: sop.estimatedTime,
        version: sop.version,
        tags: sop.tags,
        content: sop.content,
        summary: sop.summary,
        steps: sop.steps ? { items: sop.steps } : undefined,
        machineId: sop.machineId,
        revisionNotes: `Ingested from ${sop.sourcePath}`,
      };

      const existingId = existingMap.get(sop.slug);
      if (existingId) {
        const success = await updateSOP(existingId, strapiData);
        if (success) updated++;
        else failed++;
      } else {
        const success = await createSOP(strapiData);
        if (success) created++;
        else failed++;
      }
    });

    await Promise.all(promises);
  }

  const duration = Date.now() - start;
  console.log('--- SOP Seeding Summary ---');
  console.log(`File: ${filePath}`);
  console.log(`Processed: ${processed}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${duration} ms`);
}

function parseArgs(argv: string[]) {
  const args: any = { concurrency: 4, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--file') args.file = argv[++i];
    else if (argv[i] === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (!args.file) {
    console.error('ERROR: --file argument required');
    process.exit(3);
  }

  await seed(args.file, args.concurrency, args.dryRun);
}

if (require.main === module) {
  main();
}
