import { useState, useEffect, useCallback } from 'react';
import { CustomerCard, type CustomerCardData } from './CustomerCard';
import { CustomerSearch } from './CustomerSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCustomers, type CustomerAPIResponse, type StrapiPagination } from '@/lib/api/customers';
import { CaretLeft, CaretRight, Funnel, SortAscending, SortDescending, Users, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CustomerListProps {
  onSelectCustomer: (customer: CustomerCardData) => void;
  onNewOrder?: (customerId: string) => void;
}

type SortField = 'name' | 'email' | 'company' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  orderCountMin?: number;
  lastOrderDays?: number;
}

export function CustomerList({ onSelectCustomer, onNewOrder }: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerAPIResponse[]>([]);
  const [pagination, setPagination] = useState<StrapiPagination>({
    page: 1,
    pageSize: 20,
    pageCount: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchCustomers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await searchCustomers(debouncedSearch, {
        page,
        pageSize: 20,
        sortBy: sortField,
        sortOrder,
      });
      setCustomers(response.data || []);
      if (response.meta?.pagination) {
        setPagination(response.meta.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, sortField, sortOrder]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pageCount) {
      fetchCustomers(newPage);
    }
  };

  const handleSearchSelect = (customer: CustomerAPIResponse) => {
    const cardData = transformToCardData(customer);
    onSelectCustomer(cardData);
  };

  const transformToCardData = (customer: CustomerAPIResponse): CustomerCardData => ({
    id: customer.id.toString(),
    documentId: customer.documentId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    totalOrders: 0, // Will be calculated from orders when populated
    totalRevenue: 0, // Will be calculated from orders when populated
    lastOrderDate: customer.updatedAt,
    status: 'active' as const,
  });

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || filters.orderCountMin || filters.lastOrderDays;

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <CustomerSearch
            onSelect={handleSearchSelect}
            placeholder="Quick search customers..."
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortOrder} title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}>
            {sortOrder === 'asc' ? <SortAscending size={18} /> : <SortDescending size={18} />}
          </Button>

          <Button 
            variant={showFilters ? 'secondary' : 'outline'} 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Funnel size={18} />
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min. Order Count</label>
              <Select 
                value={filters.orderCountMin?.toString() || ''} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, orderCountMin: v ? parseInt(v) : undefined }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                  <SelectItem value="25">25+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last Order Within</label>
              <Select 
                value={filters.lastOrderDays?.toString() || ''} 
                onValueChange={(v) => setFilters(prev => ({ ...prev, lastOrderDays: v ? parseInt(v) : undefined }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Results summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users size={16} />
        <span>
          {pagination.total.toLocaleString()} customer{pagination.total !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>

      {/* Customer grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `No customers match "${searchQuery}"`
              : 'Start by adding your first customer'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((customer) => {
            const cardData = transformToCardData(customer);
            return (
              <CustomerCard
                key={customer.documentId || customer.id}
                customer={cardData}
                onClick={() => onSelectCustomer(cardData)}
                onNewOrder={onNewOrder ? () => onNewOrder(cardData.documentId) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pageCount > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <CaretLeft size={16} className="mr-1" />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(5, pagination.pageCount) }, (_, i) => {
                let pageNum: number;
                if (pagination.pageCount <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pageCount - 2) {
                  pageNum = pagination.pageCount - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pageCount}
            >
              Next
              <CaretRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
