/**
 * Fuzzy Matcher
 * Matches supplier products to existing internal products using fuzzy matching
 */

import Fuse from 'fuse.js';

export interface ProductMatch {
  id: string;
  confidence: number;
  product: any;
}

export interface MatchOptions {
  threshold?: number;
  minConfidence?: number;
  strictBrandMatch?: boolean;
}

/**
 * Find matching product using fuzzy search
 */
export function findMatchingProduct(
  normalizedProduct: any,
  existingProducts: any[],
  options: MatchOptions = {}
): ProductMatch | null {
  const {
    threshold = 0.3,
    minConfidence = 0.8,
    strictBrandMatch = true,
  } = options;
  
  if (existingProducts.length === 0) {
    return null;
  }
  
  // Filter by brand first if strict matching is enabled
  let candidateProducts = existingProducts;
  if (strictBrandMatch && normalizedProduct.brand) {
    candidateProducts = existingProducts.filter(
      p => p.brand?.toLowerCase() === normalizedProduct.brand?.toLowerCase()
    );
    
    if (candidateProducts.length === 0) {
      return null;
    }
  }
  
  // Configure fuzzy search
  const fuse = new Fuse(candidateProducts, {
    keys: [
      { name: 'brand', weight: 0.3 },
      { name: 'name', weight: 0.4 },
      { name: 'category', weight: 0.2 },
      { name: 'style', weight: 0.1 },
    ],
    threshold,
    includeScore: true,
  });
  
  // Search for matches
  const searchQuery = {
    $and: [
      { name: normalizedProduct.name },
    ],
  };
  
  const results = fuse.search(normalizedProduct.name);
  
  if (results.length === 0) {
    return null;
  }
  
  // Get best match
  const bestMatch = results[0];
  const confidence = 1 - (bestMatch.score || 0);
  
  // Check if confidence meets minimum threshold
  if (confidence < minConfidence) {
    return null;
  }
  
  return {
    id: bestMatch.item.id,
    confidence,
    product: bestMatch.item,
  };
}

/**
 * Find multiple potential matches
 */
export function findPotentialMatches(
  normalizedProduct: any,
  existingProducts: any[],
  options: MatchOptions = {},
  limit: number = 5
): ProductMatch[] {
  const {
    threshold = 0.4,
    minConfidence = 0.6,
    strictBrandMatch = false,
  } = options;
  
  if (existingProducts.length === 0) {
    return [];
  }
  
  // Filter by brand if strict matching is enabled
  let candidateProducts = existingProducts;
  if (strictBrandMatch && normalizedProduct.brand) {
    candidateProducts = existingProducts.filter(
      p => p.brand?.toLowerCase() === normalizedProduct.brand?.toLowerCase()
    );
  }
  
  // Configure fuzzy search
  const fuse = new Fuse(candidateProducts, {
    keys: [
      { name: 'brand', weight: 0.3 },
      { name: 'name', weight: 0.4 },
      { name: 'category', weight: 0.2 },
      { name: 'style', weight: 0.1 },
    ],
    threshold,
    includeScore: true,
  });
  
  // Search for matches
  const results = fuse.search(normalizedProduct.name).slice(0, limit);
  
  return results
    .map(result => ({
      id: result.item.id,
      confidence: 1 - (result.score || 0),
      product: result.item,
    }))
    .filter(match => match.confidence >= minConfidence);
}

/**
 * Calculate similarity score between two products
 */
export function calculateSimilarity(product1: any, product2: any): number {
  let score = 0;
  let weights = 0;
  
  // Brand match (30% weight)
  if (product1.brand && product2.brand) {
    weights += 0.3;
    if (product1.brand.toLowerCase() === product2.brand.toLowerCase()) {
      score += 0.3;
    }
  }
  
  // Name similarity (40% weight)
  if (product1.name && product2.name) {
    weights += 0.4;
    const nameSimilarity = calculateStringSimilarity(
      product1.name.toLowerCase(),
      product2.name.toLowerCase()
    );
    score += 0.4 * nameSimilarity;
  }
  
  // Category match (20% weight)
  if (product1.category && product2.category) {
    weights += 0.2;
    if (product1.category.toLowerCase() === product2.category.toLowerCase()) {
      score += 0.2;
    }
  }
  
  // Style match (10% weight)
  if (product1.style && product2.style) {
    weights += 0.1;
    if (product1.style.toLowerCase() === product2.style.toLowerCase()) {
      score += 0.1;
    }
  }
  
  return weights > 0 ? score / weights : 0;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check if two products are likely the same product
 */
export function areProductsMatching(
  product1: any,
  product2: any,
  minSimilarity: number = 0.8
): boolean {
  const similarity = calculateSimilarity(product1, product2);
  return similarity >= minSimilarity;
}
