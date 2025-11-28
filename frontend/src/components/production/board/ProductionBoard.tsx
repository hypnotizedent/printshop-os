/**
 * ProductionBoard Component
 * Kanban-style board showing today's jobs by status
 * Features:
 * - Drag and drop (simulated via click-to-move buttons)
 * - Auto-refresh every 30 seconds
 * - Rush order highlighting
 * - Touch-friendly for production floor use
 */

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MagnifyingGlass, 
  ArrowClockwise, 
  Funnel,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ProductionStats } from './ProductionStats';
import { JobCard } from './JobCard';
import { JobDetail } from './JobDetail';
import type { 
  ProductionJob, 
  ProductionStatus, 
  ProductionStats as ProductionStatsType,
} from './types';
import { PRODUCTION_COLUMNS } from './types';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';
const REFRESH_INTERVAL = 30000; // 30 seconds

interface StrapiLineItem {
  id?: number;
  description?: string;
  quantity?: number;
  category?: string;
}

interface StrapiOrder {
  id: number;
  documentId?: string;
  orderNumber?: string;
  orderNickname?: string;
  status?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  productionNotes?: string;
  notes?: string;
  customer?: {
    name?: string;
    company?: string;
  };
  items?: StrapiLineItem[];
  totalAmount?: number;
}

interface StrapiApiResponse {
  data: StrapiOrder[];
  meta?: {
    pagination?: {
      total: number;
    };
  };
}

export function ProductionBoard() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showRushOnly, setShowRushOnly] = useState(false);
  const [stats, setStats] = useState<ProductionStatsType>({
    totalJobsDueToday: 0,
    jobsInQueue: 0,
    jobsInProgress: 0,
    jobsInQualityCheck: 0,
    jobsCompleted: 0,
    rushOrderCount: 0,
    lastRefreshed: new Date(),
  });

  // Map Strapi order status to production status
  const mapStatusToProduction = (strapiStatus?: string): ProductionStatus => {
    const statusMap: Record<string, ProductionStatus> = {
      'QUOTE': 'queue',
      'QUOTE_SENT': 'queue',
      'Quote Out For Approval - Email': 'queue',
      'QUOTE_APPROVED': 'queue',
      'PENDING': 'queue',
      'IN_PRODUCTION': 'in_progress',
      'PRINTING': 'in_progress',
      'FINISHING': 'in_progress',
      'QUALITY_CHECK': 'quality_check',
      'READY_TO_SHIP': 'quality_check',
      'SHIPPED': 'complete',
      'DELIVERED': 'complete',
      'COMPLETED': 'complete',
      'COMPLETE': 'complete',
      'INVOICE PAID': 'complete',
      'INVOICE_PAID': 'complete',
    };
    return statusMap[strapiStatus || ''] || 'queue';
  };

  // Check if order is a rush order based on due date
  const isRushOrder = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue <= 24 && hoursUntilDue > 0; // Due within 24 hours
  };

  // Transform Strapi order to ProductionJob
  const transformOrder = (order: StrapiOrder): ProductionJob => {
    const lineItems = (order.items || []).map((item: StrapiLineItem, index: number) => ({
      id: item.id?.toString() || `item-${index}`,
      description: item.description || 'Unknown item',
      quantity: item.quantity || 0,
      category: item.category,
    }));

    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: order.documentId || order.id.toString(),
      documentId: order.documentId,
      orderNumber: order.orderNumber || order.id.toString(),
      customerName: order.customer?.name || order.customer?.company || 'Unknown Customer',
      status: mapStatusToProduction(order.status),
      dueDate: order.dueDate || new Date().toISOString(),
      isRush: isRushOrder(order.dueDate),
      lineItems,
      productionNotes: order.productionNotes || order.notes,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString(),
      quantity: totalQuantity,
      progress: order.status === 'COMPLETE' ? 100 : 50,
    };
  };

  // Fetch jobs from API
  const fetchJobs = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch orders due today (or adjust to fetch recent orders for demo)
      const response = await fetch(
        `${API_BASE}/api/orders?populate=customer&pagination[limit]=100&sort=dueDate:asc`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: StrapiApiResponse = await response.json();
      const transformedJobs = (data.data || []).map(transformOrder);
      
      // Sort by rush status first, then by due date
      transformedJobs.sort((a, b) => {
        if (a.isRush && !b.isRush) return -1;
        if (!a.isRush && b.isRush) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setJobs(transformedJobs);

      // Calculate stats
      const newStats: ProductionStatsType = {
        totalJobsDueToday: transformedJobs.length,
        jobsInQueue: transformedJobs.filter(j => j.status === 'queue').length,
        jobsInProgress: transformedJobs.filter(j => j.status === 'in_progress').length,
        jobsInQualityCheck: transformedJobs.filter(j => j.status === 'quality_check').length,
        jobsCompleted: transformedJobs.filter(j => j.status === 'complete').length,
        rushOrderCount: transformedJobs.filter(j => j.isRush).length,
        lastRefreshed: new Date(),
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load production jobs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchJobs();

    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      fetchJobs(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchJobs]);

  // Filter jobs based on search query and rush filter
  useEffect(() => {
    let filtered = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.orderNumber.toLowerCase().includes(query) ||
        job.customerName.toLowerCase().includes(query) ||
        job.lineItems.some(item => 
          item.description.toLowerCase().includes(query)
        )
      );
    }

    if (showRushOnly) {
      filtered = filtered.filter(job => job.isRush);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, showRushOnly]);

  // Handle job status change
  const handleStatusChange = async (jobId: string, newStatus: ProductionStatus) => {
    // Map production status back to Strapi status
    const strapiStatusMap: Record<ProductionStatus, string> = {
      'queue': 'PENDING',
      'in_progress': 'IN_PRODUCTION',
      'quality_check': 'QUALITY_CHECK',
      'complete': 'COMPLETE',
    };

    try {
      // Optimistic update
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId
            ? { ...job, status: newStatus, updatedAt: new Date().toISOString() }
            : job
        )
      );

      // Update the selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
      }

      // API call to update status
      const response = await fetch(`${API_BASE}/api/orders/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            status: strapiStatusMap[newStatus],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      toast.success(`Job moved to ${PRODUCTION_COLUMNS.find(c => c.id === newStatus)?.label}`);

      // Update stats
      setStats(prev => ({
        ...prev,
        jobsInQueue: jobs.filter(j => (j.id === jobId ? newStatus : j.status) === 'queue').length,
        jobsInProgress: jobs.filter(j => (j.id === jobId ? newStatus : j.status) === 'in_progress').length,
        jobsInQualityCheck: jobs.filter(j => (j.id === jobId ? newStatus : j.status) === 'quality_check').length,
        jobsCompleted: jobs.filter(j => (j.id === jobId ? newStatus : j.status) === 'complete').length,
      }));

    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
      // Revert on error
      fetchJobs(false);
    }
  };

  // Handle job card click
  const handleJobClick = (job: ProductionJob) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Close detail sidebar
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedJob(null), 300); // Clear after animation
  };

  // Get jobs by status for columns
  const getJobsByStatus = (status: ProductionStatus): ProductionJob[] => {
    return filteredJobs.filter(job => job.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ArrowClockwise size={48} className="animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading production jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Production Board</h1>
          <p className="text-muted-foreground mt-1">Real-time job tracking for the production floor</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => fetchJobs(false)}
          disabled={isRefreshing}
        >
          <ArrowClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <ProductionStats stats={stats} isRefreshing={isRefreshing} />

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by order #, customer, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant={showRushOnly ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setShowRushOnly(!showRushOnly)}
        >
          <Funnel size={18} />
          {showRushOnly ? 'Showing Rush Only' : 'Filter Rush Orders'}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PRODUCTION_COLUMNS.map((column) => {
          const columnJobs = getJobsByStatus(column.id);

          return (
            <div key={column.id} className="flex-shrink-0 w-80 min-w-[320px]">
              {/* Column Header */}
              <div className="mb-4">
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg border-l-4',
                  column.color,
                  column.bgColor
                )}>
                  <h3 className="font-semibold text-foreground">{column.label}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {columnJobs.length}
                  </Badge>
                </div>
              </div>

              {/* Column Jobs */}
              <div className="space-y-3 min-h-[200px]">
                {columnJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={handleJobClick}
                  />
                ))}

                {columnJobs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                    No jobs in {column.label.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Job Detail Sidebar */}
      <JobDetail
        job={selectedJob}
        open={isDetailOpen}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
