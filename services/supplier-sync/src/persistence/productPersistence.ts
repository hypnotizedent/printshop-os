import fs from 'fs';
import path from 'path';
import { UnifiedProduct } from '../types/product';
import { logger } from '../utils/logger';

// Allow dynamic data directory via env var
const DATA_DIR = process.env.SUPPLIER_DATA_DIR || process.env.ASCOLOUR_DATA_DIR || path.join(process.cwd(), 'data', 'ascolour');
const FILE_PATH = path.join(DATA_DIR, 'products.jsonl');

function ensureDir(dir: string = DATA_DIR) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Persist products to JSONL file
 * @param products Array of unified products to persist
 * @param supplier Optional supplier name to use specific directory
 */
export function persistProducts(products: UnifiedProduct[], supplier?: string) {
  const targetDir = supplier 
    ? path.join(process.cwd(), 'data', supplier)
    : DATA_DIR;
  const targetFile = path.join(targetDir, 'products.jsonl');
  
  ensureDir(targetDir);
  
  const stream = fs.createWriteStream(targetFile, { flags: 'a' });
  let count = 0;
  for (const p of products) {
    stream.write(JSON.stringify(p) + '\n');
    count++;
  }
  stream.end();
  logger.info(`Persisted ${supplier || 'supplier'} products`, { count, file: targetFile });
}

export function readPersistedProducts(limit = 50, supplier?: string): UnifiedProduct[] {
  const targetDir = supplier 
    ? path.join(process.cwd(), 'data', supplier)
    : DATA_DIR;
  const targetFile = path.join(targetDir, 'products.jsonl');
  
  if (!fs.existsSync(targetFile)) return [];
  const lines = fs.readFileSync(targetFile, 'utf-8').trim().split('\n');
  return lines.slice(0, limit).map(l => JSON.parse(l));
}
