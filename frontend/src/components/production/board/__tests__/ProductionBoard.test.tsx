/**
 * Production Board Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductionBoard } from '../ProductionBoard';
import { ProductionStats } from '../ProductionStats';
import { JobCard } from '../JobCard';
import { JobDetail } from '../JobDetail';
import type { ProductionJob, ProductionStats as ProductionStatsType } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProductionBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            documentId: 'doc-1',
            orderNumber: 'ORD-001',
            status: 'PENDING',
            dueDate: new Date().toISOString(),
            customer: { name: 'Test Customer' },
            items: [{ description: 'Test Item', quantity: 100 }],
          },
        ],
        meta: { pagination: { total: 1 } },
      }),
    });
  });

  it('renders the production board with title', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      expect(screen.getByText('Production Board')).toBeInTheDocument();
    });
  });

  it('renders all four status columns', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      // Use getAllByRole to find column headers which are h3 elements
      const headings = screen.getAllByRole('heading', { level: 3 });
      const headingTexts = headings.map(h => h.textContent);
      
      expect(headingTexts).toContain('Queue');
      expect(headingTexts).toContain('In Progress');
      expect(headingTexts).toContain('Quality Check');
      expect(headingTexts).toContain('Complete');
    });
  });

  it('shows loading state initially', () => {
    render(<ProductionBoard />);
    expect(screen.getByText('Loading production jobs...')).toBeInTheDocument();
  });

  it('fetches jobs on mount', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('displays jobs after loading', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });
  });

  it('has a refresh button', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  it('has a search input', async () => {
    render(<ProductionBoard />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by order/i)).toBeInTheDocument();
    });
  });
});

describe('ProductionStats', () => {
  const mockStats: ProductionStatsType = {
    totalJobsDueToday: 10,
    jobsInQueue: 3,
    jobsInProgress: 4,
    jobsInQualityCheck: 2,
    jobsCompleted: 1,
    rushOrderCount: 2,
    lastRefreshed: new Date(),
  };

  it('renders all stat cards', () => {
    render(<ProductionStats stats={mockStats} />);

    expect(screen.getByText('Due Today')).toBeInTheDocument();
    expect(screen.getByText('In Queue')).toBeInTheDocument();
    // Use getAllByText since "In Progress" appears in both stats and column headers
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays correct stat values', () => {
    render(<ProductionStats stats={mockStats} />);

    expect(screen.getByText('10')).toBeInTheDocument(); // totalJobsDueToday
    expect(screen.getByText('3')).toBeInTheDocument(); // jobsInQueue
    expect(screen.getByText('4')).toBeInTheDocument(); // jobsInProgress
    expect(screen.getByText('1')).toBeInTheDocument(); // jobsCompleted
  });

  it('shows rush order badge when there are rush orders', () => {
    render(<ProductionStats stats={mockStats} />);

    expect(screen.getByText(/2 Rush Orders/i)).toBeInTheDocument();
  });

  it('does not show rush order badge when no rush orders', () => {
    const noRushStats = { ...mockStats, rushOrderCount: 0 };
    render(<ProductionStats stats={noRushStats} />);

    expect(screen.queryByText(/Rush Order/i)).not.toBeInTheDocument();
  });

  it('shows last updated time', () => {
    render(<ProductionStats stats={mockStats} />);

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });
});

describe('JobCard', () => {
  const mockJob: ProductionJob = {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'Test Customer',
    status: 'queue',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    isRush: false,
    lineItems: [
      { id: '1', description: '500x Black T-Shirts', quantity: 500 },
      { id: '2', description: '200x White Hoodies', quantity: 200 },
    ],
    productionNotes: 'Handle with care',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quantity: 700,
    progress: 0,
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order number', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
  });

  it('renders customer name', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });

  it('renders line items', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText(/500x Black T-Shirts/i)).toBeInTheDocument();
    expect(screen.getByText(/200x White Hoodies/i)).toBeInTheDocument();
  });

  it('renders production notes', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText(/Handle with care/i)).toBeInTheDocument();
  });

  it('shows rush badge for rush orders', () => {
    const rushJob = { ...mockJob, isRush: true };
    render(<JobCard job={rushJob} onClick={mockOnClick} />);

    expect(screen.getByText('Rush')).toBeInTheDocument();
  });

  it('does not show rush badge for non-rush orders', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.queryByText('Rush')).not.toBeInTheDocument();
  });

  it('shows total quantity', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText('700 pcs')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);
    
    const card = screen.getByText('#ORD-001').closest('[class*="cursor-pointer"]');
    if (card) {
      await userEvent.click(card);
    }

    expect(mockOnClick).toHaveBeenCalledWith(mockJob);
  });

  it('displays formatted due date', () => {
    render(<JobCard job={mockJob} onClick={mockOnClick} />);

    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });
});

describe('JobDetail', () => {
  const mockJob: ProductionJob = {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'Test Customer',
    status: 'queue',
    dueDate: new Date().toISOString(),
    isRush: true,
    lineItems: [
      { id: '1', description: '500x Black T-Shirts', quantity: 500 },
    ],
    productionNotes: 'Priority order',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quantity: 500,
    progress: 0,
  };

  const mockOnClose = vi.fn();
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when job is null', () => {
    const { container } = render(
      <JobDetail 
        job={null} 
        open={false} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders job details when open', () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });

  it('shows rush badge for rush orders', () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    expect(screen.getByText('Rush')).toBeInTheDocument();
  });

  it('displays line items', () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    expect(screen.getByText('500x Black T-Shirts')).toBeInTheDocument();
  });

  it('displays production notes', () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    expect(screen.getByText('Priority order')).toBeInTheDocument();
  });

  it('has status change buttons', () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    // Since job is in queue, there should be a forward button to In Progress
    const buttons = screen.getAllByRole('button');
    const inProgressButton = buttons.find(btn => btn.textContent?.includes('In Progress'));
    expect(inProgressButton).toBeDefined();
  });

  it('calls onStatusChange when forward button is clicked', async () => {
    render(
      <JobDetail 
        job={mockJob} 
        open={true} 
        onClose={mockOnClose} 
        onStatusChange={mockOnStatusChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    const forwardButton = buttons.find(btn => btn.textContent?.includes('In Progress'));
    if (forwardButton) {
      await userEvent.click(forwardButton);
    }

    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'in_progress');
  });
});
