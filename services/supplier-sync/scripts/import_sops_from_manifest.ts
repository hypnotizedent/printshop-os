#!/usr/bin/env ts-node
/*
 * SOP Manifest-Based Ingestion Script
 * Reads sop_manifest.yml and creates canonical JSONL
 * Exit Codes: 0 success, 2 validation errors, 3 IO failure
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';

interface SOPManifestEntry {
  title: string;
  source: string;
  category: string;
  tags?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  status?: 'draft' | 'active' | 'deprecated';
  version?: number;
  estimatedTime?: number;
  machineId?: string;
  related?: string[];
}

interface SOPManifest {
  defaults?: {
    owner?: string;
    reviewers?: string[];
    difficulty?: string;
  };
  sops: SOPManifestEntry[];
}

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

function parseYaml(filePath: string): SOPManifest {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple YAML parsing for this specific structure
  const lines = content.split('\n');
  const manifest: SOPManifest = { sops: [] };
  let currentSop: Partial<SOPManifestEntry> | null = null;
  let inSopsSection = false;
  let inDefaults = false;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('defaults:')) {
      inDefaults = true;
      manifest.defaults = {};
      continue;
    }
    if (line.startsWith('sops:')) {
      inSopsSection = true;
      inDefaults = false;
      continue;
    }

    if (inDefaults) {
      if (line.startsWith('difficulty:')) {
        manifest.defaults!.difficulty = line.split(':')[1].trim().replace(/['"]/g, '');
      }
      continue;
    }

    if (inSopsSection) {
      if (line.startsWith('- title:')) {
        if (currentSop) {
          manifest.sops.push(currentSop as SOPManifestEntry);
        }
        currentSop = { title: line.split('title:')[1].trim().replace(/['"]/g, ''), source: '', category: '' };
      } else if (currentSop) {
        if (line.startsWith('source:')) {
          currentSop.source = line.split('source:')[1].trim().replace(/['"]/g, '');
        } else if (line.startsWith('category:')) {
          currentSop.category = line.split('category:')[1].trim().replace(/['"]/g, '');
        } else if (line.startsWith('difficulty:')) {
          currentSop.difficulty = line.split('difficulty:')[1].trim().replace(/['"]/g, '') as any;
        } else if (line.startsWith('tags:')) {
          const tagsStr = line.split('tags:')[1].trim();
          currentSop.tags = JSON.parse(tagsStr.replace(/'/g, '"'));
        } else if (line.startsWith('related:')) {
          const relatedStr = line.split('related:')[1].trim();
          currentSop.related = JSON.parse(relatedStr.replace(/'/g, '"'));
        }
      }
    }
  }

  if (currentSop) {
    manifest.sops.push(currentSop as SOPManifestEntry);
  }

  return manifest;
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function main() {
  const args = process.argv.slice(2);
  const manifestPath = args.find(a => !a.startsWith('--')) || 'data/raw/sops/sop_manifest.yml';
  const outPath = args.find((a, i) => args[i - 1] === '--out') || 'data/processed/sops/sops.jsonl';
  const dryRun = args.includes('--dry-run');

  const now = new Date().toISOString();
  const baseDir = path.dirname(manifestPath);

  try {
    const manifest = parseYaml(manifestPath);
    const sops: CanonicalSOP[] = [];
    const errors: string[] = [];

    for (const entry of manifest.sops) {
      if (!entry.title || !entry.source || !entry.category) {
        errors.push(`Missing required fields for entry: ${JSON.stringify(entry)}`);
        continue;
      }

      const sourcePath = path.join(baseDir, entry.source);
      let sourceHash = '';
      let content = `# ${entry.title}\n\n`;

      // Try to read the source file
      if (fs.existsSync(sourcePath)) {
        if (fs.statSync(sourcePath).isDirectory()) {
          // Handle directory (e.g., "01 Receiving" folder with images)
          const files = fs.readdirSync(sourcePath).filter(f => f.match(/\.(jpg|jpeg|png|pdf)$/i));
          content += `Source: Directory with ${files.length} files\n\n`;
          content += `Files:\n${files.map(f => `- ${f}`).join('\n')}\n`;
          sourceHash = computeHash(files.join(','));
        } else {
          // Regular file - just store metadata for now
          const stats = fs.statSync(sourcePath);
          content += `Source: ${entry.source}\n`;
          content += `File size: ${stats.size} bytes\n\n`;
          content += `*PDF/Document content extraction pending - see source file*\n`;
          sourceHash = computeHash(stats.size.toString() + stats.mtime.toISOString());
        }
      } else {
        content += `*Source file not found: ${entry.source}*\n`;
        sourceHash = computeHash(entry.source);
      }

      if (entry.tags) {
        content += `\nTags: ${entry.tags.join(', ')}`;
      }

      const sop: CanonicalSOP = {
        id: randomUUID(),
        slug: createSlug(entry.title),
        title: entry.title,
        category: entry.category,
        status: entry.status || 'draft',
        difficulty: entry.difficulty || manifest.defaults?.difficulty as any,
        version: entry.version || 1,
        tags: entry.tags,
        content,
        summary: entry.title,
        machineId: entry.machineId,
        related: entry.related,
        sourcePath: entry.source,
        sourceHash,
        createdAt: now,
        updatedAt: now,
      };

      sops.push(sop);
    }

    console.log('--- SOP Ingestion Summary ---');
    console.log(`Total entries: ${manifest.sops.length}`);
    console.log(`Processed: ${sops.length}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.error('\nErrors:');
      errors.forEach(e => console.error(`  - ${e}`));
    }

    if (!dryRun && sops.length > 0) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const lines = sops.map(s => JSON.stringify(s)).join('\n') + '\n';
      fs.writeFileSync(outPath, lines, 'utf8');
      
      const manifestOut = {
        generatedAt: now,
        sourceManifest: manifestPath,
        totalSOPs: sops.length,
        categories: [...new Set(sops.map(s => s.category))],
      };
      fs.writeFileSync(
        path.join(path.dirname(outPath), 'sop-manifest.json'),
        JSON.stringify(manifestOut, null, 2)
      );
      
      console.log(`\nWrote ${sops.length} SOPs to ${outPath}`);
      console.log(`Manifest written to ${path.dirname(outPath)}/sop-manifest.json`);
    } else if (dryRun) {
      console.log('\nDry run - no files written');
    }

    process.exit(errors.length > 0 ? 2 : 0);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    process.exit(3);
  }
}

if (require.main === module) {
  main();
}
