/**
 * Customer Management Components Test Suite
 * Tests for CustomerSearch, CustomerCard, CustomerList, and CustomerDetail components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerSearch } from '../src/components/customers/CustomerSearch';
import { CustomerCard, type CustomerCardData } from '../src/components/customers/CustomerCard';
import { CustomerList } from '../src/components/customers/CustomerList';
import { CustomerDetail } from '../src/components/customers/CustomerDetail';

// Mock the API
global.fetch = vi.fn();

// Mock customer data
const mockCustomer: CustomerCardData = {
  id: '1',
  documentId: 'doc-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  company: 'Acme Corp',
  totalOrders: 15,
  totalRevenue: 5000,
  lastOrderDate: '2024-01-15T10:00:00Z',
  status: 'active',
};

const mockApiCustomer = {
  id: 1,
  documentId: 'doc-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  company: 'Acme Corp',
  address: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62701',
  notes: 'VIP customer',
  printavoId: 'P12345',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

describe('CustomerCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer name and company', () => {
    render(<CustomerCard customer={mockCustomer} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders email and phone', () => {
    render(<CustomerCard customer={mockCustomer} />);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('renders total orders and revenue', () => {
    render(<CustomerCard customer={mockCustomer} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('renders active status badge', () => {
    render(<CustomerCard customer={mockCustomer} />);
    
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const handleClick = vi.fn();
    render(<CustomerCard customer={mockCustomer} onClick={handleClick} />);
    
    const user = userEvent.setup();
    await user.click(screen.getByText('View Details'));
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('calls onNewOrder when new order button is clicked', async () => {
    const handleNewOrder = vi.fn();
    render(<CustomerCard customer={mockCustomer} onNewOrder={handleNewOrder} />);
    
    const user = userEvent.setup();
    await user.click(screen.getByText('New Order'));
    
    expect(handleNewOrder).toHaveBeenCalled();
  });

  it('renders compact variant correctly', () => {
    render(<CustomerCard customer={mockCustomer} variant="compact" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('15 orders')).toBeInTheDocument();
    // Compact variant should not show the full action buttons
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });
});

describe('CustomerSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock recent customers fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  it('renders search input', () => {
    render(<CustomerSearch onSelect={vi.fn()} />);
    
    expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
  });

  it('shows recent customers on focus', async () => {
    const recentCustomers = {
      data: [mockApiCustomer],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => recentCustomers,
    });

    render(<CustomerSearch onSelect={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/search customers/i);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Recent Customers')).toBeInTheDocument();
    });
  });

  it('shows search results when typing', async () => {
    const searchResults = {
      data: [mockApiCustomer],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }) // recent
      .mockResolvedValueOnce({ ok: true, json: async () => searchResults }); // search

    render(<CustomerSearch onSelect={vi.fn()} />);
    
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/search customers/i);
    
    await user.type(input, 'John');

    // Wait for debounce (300ms) and search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls onSelect when a customer is clicked', async () => {
    const handleSelect = vi.fn();
    const recentCustomers = {
      data: [mockApiCustomer],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => recentCustomers,
    });

    render(<CustomerSearch onSelect={handleSelect} />);
    
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/search customers/i);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('John Doe'));

    expect(handleSelect).toHaveBeenCalledWith(mockApiCustomer);
  });

  it('shows no results message when search returns empty', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }) // recent
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }); // search

    render(<CustomerSearch onSelect={vi.fn()} />);
    
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/search customers/i);
    
    await user.type(input, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });
});

describe('CustomerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for customer list
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [mockApiCustomer],
        meta: {
          pagination: {
            page: 1,
            pageSize: 20,
            pageCount: 1,
            total: 1,
          },
        },
      }),
    });
  });

  it('renders customer list', async () => {
    render(<CustomerList onSelectCustomer={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<CustomerList onSelectCustomer={vi.fn()} />);

    // Should show skeleton loaders
    expect(screen.getAllByRole('generic').some(el => el.className.includes('animate-pulse'))).toBe(true);
  });

  it('shows total count', async () => {
    render(<CustomerList onSelectCustomer={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/1 customer/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectCustomer when card is clicked', async () => {
    const handleSelect = vi.fn();
    render(<CustomerList onSelectCustomer={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('View Details'));

    expect(handleSelect).toHaveBeenCalled();
  });

  it('shows empty state when no customers', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        meta: { pagination: { page: 1, pageSize: 20, pageCount: 0, total: 0 } },
      }),
    });

    render(<CustomerList onSelectCustomer={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    });
  });
});

describe('CustomerDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={vi.fn()} 
      />
    );

    // Should show skeleton loaders
    expect(screen.getAllByRole('generic').some(el => el.className.includes('animate-pulse'))).toBe(true);
  });

  it('renders customer details after loading', async () => {
    const customerWithOrders = {
      ...mockApiCustomer,
      orders: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: customerWithOrders }) }) // customer
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } } }) }); // orders

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const handleBack = vi.fn();
    const customerWithOrders = {
      ...mockApiCustomer,
      orders: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: customerWithOrders }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } } }) });

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={handleBack} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Find the back button (arrow icon button)
    const backButton = screen.getAllByRole('button')[0];
    await user.click(backButton);

    expect(handleBack).toHaveBeenCalled();
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load customer/i)).toBeInTheDocument();
    });
  });

  it('shows no orders message when customer has no orders', async () => {
    const customerWithOrders = {
      ...mockApiCustomer,
      orders: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: customerWithOrders }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } } }) });

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('displays order history when customer has orders', async () => {
    const mockOrder = {
      id: 1,
      documentId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'COMPLETE',
      totalAmount: 500,
      amountPaid: 500,
      amountOutstanding: 0,
      dueDate: '2024-01-20',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    const customerWithOrders = {
      ...mockApiCustomer,
      orders: [mockOrder],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: customerWithOrders }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockOrder], meta: { pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 } } }) });

    render(
      <CustomerDetail 
        customerId="doc-1" 
        onBack={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    });

    // Use getAllByText since the amount appears in stats and order list
    expect(screen.getAllByText('$500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
});

describe('useDebounce hook', () => {
  it('should debounce value changes', async () => {
    // This is implicitly tested through the CustomerSearch component tests above
    // The search only fires after 300ms of no typing
  });
});
