/**
 * Colors Catalog API Routes
 * Provides list and nearest-color matching against Strapi color entries.
 */
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface StrapiColorEntry {
  id: number;
  attributes: {
    name: string;
    slug: string;
    medium: string;
    vendor: string;
    hex: string;
    finish?: string;
    tags?: string[];
    pantone?: string;
    usageConstraints?: unknown;
    similar?: string[];
    meta?: unknown;
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^([0-9A-Fa-f]{6})$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// GET /api/colors
// Query params: medium, vendor, search, limit (default 100)
router.get('/', async (req: Request, res: Response) => {
  try {
    const medium = (req.query.medium as string) || undefined;
    const vendor = (req.query.vendor as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));

    const filters: any = {};
    if (medium) filters.medium = { $eq: medium };
    if (vendor) filters.vendor = { $eq: vendor };
    if (search) {
      filters.$or = [
        { name: { $containsi: search } },
        { slug: { $containsi: search } },
        { vendor: { $containsi: search } },
      ];
    }

    const response = await axios.get(`${STRAPI_URL}/api/colors`, {
      params: {
        filters,
        pagination: { page: 1, pageSize: limit },
        sort: ['name:asc'],
      },
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    });

    const data: StrapiColorEntry[] = response.data.data || [];
    res.json({
      data: data.map(d => ({ id: d.id, ...d.attributes })),
      count: data.length,
    });
  } catch (e: any) {
    console.error('Colors list error:', e.message);
    res.status(500).json({ error: 'Failed to fetch colors', message: e.message });
  }
});

// GET /api/colors/nearest?hex=#FF0000&limit=5&medium=ink
router.get('/nearest', async (req: Request, res: Response) => {
  try {
    const hex = (req.query.hex as string) || '';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 5));
    const medium = (req.query.medium as string) || undefined;

    const targetRgb = hexToRgb(hex);
    if (!targetRgb) {
      res.status(400).json({ error: 'Invalid hex parameter' });
      return;
    }

    // Fetch a broader set (up to 500) to compute nearest
    const response = await axios.get(`${STRAPI_URL}/api/colors`, {
      params: {
        filters: medium ? { medium: { $eq: medium } } : undefined,
        pagination: { page: 1, pageSize: 500 },
      },
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    });

    const entries: StrapiColorEntry[] = response.data.data || [];
    const scored = entries
      .map(entry => {
        const rgb = hexToRgb(entry.attributes.hex);
        if (!rgb) return null;
        return { entry, distance: rgbDistance(targetRgb, rgb) };
      })
      .filter(Boolean) as { entry: StrapiColorEntry; distance: number }[];

    scored.sort((a, b) => a.distance - b.distance);
    const top = scored.slice(0, limit).map(s => ({ id: s.entry.id, distance: s.distance, ...s.entry.attributes }));

    res.json({ target: hex.toUpperCase(), medium, results: top });
  } catch (e: any) {
    console.error('Colors nearest error:', e.message);
    res.status(500).json({ error: 'Failed to compute nearest colors', message: e.message });
  }
});

export default router;
