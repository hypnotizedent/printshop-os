/**
 * ProductSearch Component
 * Autocomplete search component for selecting products in QuoteBuilder.
 * Shows thumbnail, name, SKU, and price as you type.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MagnifyingGlass, 
  Package, 
  X,
  Check,
} from '@phosphor-icons/react';
import type { Product } from './ProductsPage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// API response types
interface StrapiProductResponse {
  id: number;
  documentId: string;
  name?: string;
  sku?: string;
  brand?: string;
  category?: string;
  description?: string;
  pricing?: { basePrice?: string };
  images?: string[];
  colors?: string[];
  sizes?: string[];
  variants?: unknown[];
  supplier?: string;
  inStock?: boolean;
}

// Demo products for fallback
const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    documentId: 'demo-1',
    name: 'Classic Tee',
    sku: 'AS-5001',
    brand: 'AS Colour',
    category: 't-shirts',
    description: 'A classic fit tee with a round neck.',
    basePrice: 8.50,
    imageUrl: 'https://placehold.co/80x80/1a1a1a/ffffff?text=Tee',
    colors: ['Black', 'White', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    variants: [],
    supplier: 'ascolour',
    inStock: true,
  },
  {
    id: 2,
    documentId: 'demo-2',
    name: 'Heavy Cotton Tee',
    sku: 'G500',
    brand: 'Gildan',
    category: 't-shirts',
    description: '5.3 oz., 100% preshrunk cotton.',
    basePrice: 4.25,
    imageUrl: 'https://placehold.co/80x80/1a1a1a/ffffff?text=G500',
    colors: ['Black', 'White', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    variants: [],
    supplier: 'sanmar',
    inStock: true,
  },
  {
    id: 3,
    documentId: 'demo-3',
    name: 'Pullover Hoodie',
    sku: 'AS-5101',
    brand: 'AS Colour',
    category: 'hoodies',
    description: 'Mid-weight fleece hoodie.',
    basePrice: 28.00,
    imageUrl: 'https://placehold.co/80x80/1a1a1a/ffffff?text=Hood',
    colors: ['Black', 'Navy', 'Grey'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    variants: [],
    supplier: 'ascolour',
    inStock: true,
  },
  {
    id: 4,
    documentId: 'demo-4',
    name: 'Bella+Canvas 3001',
    sku: 'BC-3001',
    brand: 'Bella+Canvas',
    category: 't-shirts',
    description: 'The retail fit favorite.',
    basePrice: 5.50,
    imageUrl: 'https://placehold.co/80x80/1a1a1a/ffffff?text=BC',
    colors: ['Black', 'White', 'Heather Grey'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    variants: [],
    supplier: 'ssactivewear',
    inStock: true,
  },
];

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  selectedProduct?: Product | null;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function ProductSearch({ 
  onSelect, 
  selectedProduct, 
  onClear,
  placeholder = 'Search products by name or SKU...',
  className = '',
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('pagination[limit]', '10');
        params.set('filters[$or][0][name][$containsi]', query);
        params.set('filters[$or][1][sku][$containsi]', query);
        params.set('filters[$or][2][brand][$containsi]', query);

        const response = await fetch(`${API_BASE}/api/products?${params.toString()}`);
        
        if (!response.ok) throw new Error('Failed to search products');
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
          // Fallback to demo products if no API results
          const filtered = DEMO_PRODUCTS.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered);
        } else {
          // Transform API response
          const transformed: Product[] = (data.data || []).map((item: StrapiProductResponse) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name || 'Unknown Product',
            sku: item.sku || '',
            brand: item.brand || 'Generic',
            category: item.category || 'other',
            description: item.description || '',
            basePrice: parseFloat(item.pricing?.basePrice || '0') || 0,
            imageUrl: item.images?.[0] || '',
            colors: item.colors || [],
            sizes: item.sizes || [],
            variants: [],
            supplier: item.supplier || 'Unknown',
            inStock: item.inStock !== false,
          }));
          setResults(transformed);
        }
        setIsOpen(true);
        setFocusedIndex(-1);
      } catch (error) {
        console.error('Product search failed:', error);
        // Fallback to demo products
        const filtered = DEMO_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((product: Product) => {
    onSelect(product);
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          handleSelect(results[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, results, focusedIndex, handleSelect]);

  const handleClear = () => {
    if (onClear) onClear();
    setQuery('');
    inputRef.current?.focus();
  };

  // If a product is selected, show it instead of search
  if (selectedProduct) {
    return (
      <div className={`relative ${className}`}>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
              {selectedProduct.imageUrl ? (
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={20} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{selectedProduct.name}</span>
                <Check size={16} className="text-green-600 flex-shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedProduct.brand} · {selectedProduct.sku} · ${selectedProduct.basePrice.toFixed(2)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlass 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          size={18} 
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 py-1 max-h-[320px] overflow-auto shadow-lg">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Package size={32} className="mx-auto mb-2" />
              <p className="text-sm">No products found for "{query}"</p>
            </div>
          ) : (
            <div>
              {results.map((product, index) => (
                <button
                  key={product.id}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left ${
                    focusedIndex === index ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{product.name}</span>
                      {product.inStock === false && (
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.brand} · {product.sku}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-primary">
                      ${product.basePrice.toFixed(2)}
                    </span>
                    <p className="text-xs text-muted-foreground">per unit</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
