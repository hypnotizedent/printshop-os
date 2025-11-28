import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCustomers, getRecentCustomers, type CustomerAPIResponse } from '@/lib/api/customers';
import { MagnifyingGlass, Clock, Buildings, EnvelopeSimple, X } from '@phosphor-icons/react';

interface CustomerSearchProps {
  onSelect: (customer: CustomerAPIResponse) => void;
  placeholder?: string;
}

export function CustomerSearch({ onSelect, placeholder = 'Search customers by name, email, company, or phone...' }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CustomerAPIResponse[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerAPIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent customers on mount
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await getRecentCustomers(5);
        setRecentCustomers(response.data || []);
      } catch (err) {
        console.error('Failed to fetch recent customers:', err);
      }
    };
    fetchRecent();
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await searchCustomers(debouncedQuery, { pageSize: 10 });
        setResults(response.data || []);
      } catch (err) {
        setError('Failed to search customers');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

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

  const handleSelect = (customer: CustomerAPIResponse) => {
    onSelect(customer);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const displayResults = query.trim() ? results : recentCustomers;
  const showRecentLabel = !query.trim() && recentCustomers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MagnifyingGlass 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
          size={18} 
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg max-h-[400px] overflow-auto">
          {isLoading && (
            <div className="p-3 space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {showRecentLabel && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b">
                  <Clock size={12} />
                  Recent Customers
                </div>
              )}

              {displayResults.length > 0 ? (
                <ul className="py-1">
                  {displayResults.map((customer) => (
                    <li key={customer.documentId || customer.id}>
                      <button
                        onClick={() => handleSelect(customer)}
                        className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {customer.name}
                            </p>
                            {customer.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <Buildings size={12} className="shrink-0" />
                                <span className="truncate">{customer.company}</span>
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <EnvelopeSimple size={12} className="shrink-0" />
                                <span className="truncate">{customer.email}</span>
                              </p>
                            )}
                          </div>
                          {customer.printavoId && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Printavo
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim() && !isLoading ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No customers found matching "{query}"
                </div>
              ) : !showRecentLabel ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Start typing to search customers...
                </div>
              ) : null}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
