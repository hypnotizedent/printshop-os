#!/usr/bin/env ts-node
/*
 * Color Catalog Ingestion Script
 * Phase: Initial (no Strapi seeding yet)
 * Exit Codes: 0 success, 2 validation errors, 3 IO failure
 */

import * as fs from 'fs';
import * as path from 'path';
import { createColorSpecification, mergeDuplicate, validateColor, computeSha256, CatalogManifest, IngestionResultSummary, RawColorRecord, ColorSpecification } from '../../../lib/ptavo/colors/types';

interface Args {
  ink?: string;
  thread?: string;
  out?: string;
  manifest?: string;
  dryRun?: boolean;
  limit?: number;
  recomputeLab?: boolean; // reserved
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--recompute-lab') args.recomputeLab = true;
    else if (a === '--ink') args.ink = argv[++i];
    else if (a === '--thread') args.thread = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--manifest') args.manifest = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
  }
  return args;
}

function readJsonArray(filePath: string): RawColorRecord[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) throw new Error(`File ${filePath} is not an array`);
  // Normalize the incoming format to match our RawColorRecord interface
  return parsed.map((item: any) => ({
    name: item.name,
    vendor: 'standard-catalog', // Default vendor since source doesn't specify
    hex: item.hex,
    pantone: item.code || item.name, // Use code as pantone reference
    tags: item.type ? [item.type] : [],
    ...item // Preserve all other fields in meta
  })) as RawColorRecord[];
}

function ensureDir(p: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv);
  const start = Date.now();
  const nowIso = new Date().toISOString();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!args.ink && !args.thread) {
    console.error('ERROR: At least one of --ink or --thread must be provided');
    process.exit(3);
  }
  if (!args.out) {
    console.error('ERROR: --out must be provided');
    process.exit(3);
  }
  if (!args.manifest) {
    console.error('ERROR: --manifest must be provided');
    process.exit(3);
  }

  const sourceFiles: CatalogManifest['sourceFiles'] = [];
  const colorMap = new Map<string, ColorSpecification>();
  let duplicatesMerged = 0;
  let totalRaw = 0;

  const processFile = (fp: string, medium: 'ink' | 'thread') => {
    const rawRecords = readJsonArray(fp);
    const sha = computeSha256(fs.readFileSync(fp, 'utf8'));
    sourceFiles.push({ path: fp, sha256: sha, count: rawRecords.length, medium });

    for (const r of rawRecords) {
      if (args.limit && totalRaw >= args.limit) break;
      totalRaw++;
      const spec = createColorSpecification(r, medium, nowIso);
      if (!spec) {
        warnings.push(`Skipped record missing required fields (medium=${medium})`);
        continue;
      }
      const validationErrors = validateColor(spec);
      if (validationErrors.length) {
        errors.push(`Validation failed for slug=${spec.slug}: ${validationErrors.join(', ')}`);
        continue;
      }
      const existing = colorMap.get(spec.slug);
      if (existing) {
        const merged = mergeDuplicate(existing, spec);
        colorMap.set(spec.slug, merged);
        duplicatesMerged++;
      } else {
        colorMap.set(spec.slug, spec);
      }
    }
  };

  try {
    if (args.ink) processFile(args.ink, 'ink');
    if (args.thread) processFile(args.thread, 'thread');
  } catch (e: any) {
    console.error('ERROR: Failed during ingestion:', e.message);
    process.exit(3);
  }

  const manifest: CatalogManifest = {
    generatedAt: nowIso,
    sourceFiles,
    totalColors: colorMap.size,
  };

  const summary: IngestionResultSummary = {
    totalRaw,
    processed: colorMap.size,
    duplicatesMerged,
    errors,
    warnings,
    durationMs: Date.now() - start,
    manifest,
  };

  // Output summary
  console.log('--- Color Ingestion Summary ---');
  console.log(`Raw records:          ${summary.totalRaw}`);
  console.log(`Processed (unique):   ${summary.processed}`);
  console.log(`Duplicates merged:    ${summary.duplicatesMerged}`);
  console.log(`Errors:               ${summary.errors.length}`);
  console.log(`Warnings:             ${summary.warnings.length}`);
  console.log(`Duration:             ${summary.durationMs} ms`);

  if (summary.errors.length) {
    console.error('Validation errors encountered.');
    summary.errors.slice(0, 10).forEach(e => console.error('  -', e));
  }
  if (summary.warnings.length) {
    summary.warnings.slice(0, 10).forEach(w => console.warn('WARN:', w));
  }

  if (args.dryRun) {
    console.log('Dry run mode: no files written.');
  } else {
    if (!summary.errors.length) {
      try {
        ensureDir(args.out!);
        ensureDir(args.manifest!);
        const lines = Array.from(colorMap.values()).map(c => JSON.stringify(c)).join('\n') + '\n';
        fs.writeFileSync(args.out!, lines, 'utf8');
        fs.writeFileSync(args.manifest!, JSON.stringify(manifest, null, 2));
        console.log(`Wrote ${colorMap.size} colors to ${args.out}`);
        console.log(`Manifest written to ${args.manifest}`);
      } catch (e: any) {
        console.error('ERROR: Failed writing output files:', e.message);
        process.exit(3);
      }
    } else {
      console.error('Aborting write due to validation errors.');
      process.exit(2);
    }
  }

  process.exit(summary.errors.length ? 2 : 0);
}

if (require.main === module) {
  main();
}
