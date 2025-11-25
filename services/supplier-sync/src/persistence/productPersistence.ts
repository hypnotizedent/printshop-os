import fs from 'fs';
import path from 'path';
import { UnifiedProduct } from '../types/product';
import { logger } from '../utils/logger';

const DATA_DIR = process.env.ASCOLOUR_DATA_DIR || path.join(process.cwd(), 'data', 'ascolour');
const FILE_PATH = path.join(DATA_DIR, 'products.jsonl');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function persistProducts(products: UnifiedProduct[]) {
  ensureDir();
  const stream = fs.createWriteStream(FILE_PATH, { flags: 'a' });
  let count = 0;
  for (const p of products) {
    stream.write(JSON.stringify(p) + '\n');
    count++;
  }
  stream.end();
  logger.info('Persisted AS Colour products', { count, file: FILE_PATH });
}

export function readPersistedProducts(limit = 50): UnifiedProduct[] {
  if (!fs.existsSync(FILE_PATH)) return [];
  const lines = fs.readFileSync(FILE_PATH, 'utf-8').trim().split('\n');
  return lines.slice(0, limit).map(l => JSON.parse(l));
}
