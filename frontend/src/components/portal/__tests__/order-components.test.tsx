import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { StatusTimeline } from '../StatusTimeline'
import { OrderCard } from '../OrderCard'
import type { Order, OrderStatus } from '@/lib/types'

// Mock order data
const mockOrder: Order = {
  id: 1,
  attributes: {
    printavoId: '12345',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp'
    },
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001'
    },
    status: 'in_production',
    totals: {
      subtotal: 100,
      tax: 8.5,
      shipping: 10,
      discount: 0,
      fees: 0,
      total: 118.5,
      amountPaid: 50,
      amountOutstanding: 68.5
    },
    lineItems: [
      {
        id: 'item-1',
        description: 'Custom T-Shirts',
        category: 'Screen Printing',
        quantity: 50,
        unitCost: 2,
        taxable: true,
        total: 100
      }
    ],
    timeline: {
      createdAt: '2025-11-28T12:00:00Z',
      updatedAt: '2025-11-28T14:00:00Z',
      dueDate: '2025-12-05T12:00:00Z'
    },
    notes: 'Rush order',
    orderNickname: 'Company Event Shirts'
  }
}

describe('StatusTimeline Component', () => {
  it('renders timeline for in_production status', () => {
    render(<StatusTimeline status="in_production" />)
    
    // Should show all workflow steps (getAllByText because both desktop and mobile views exist)
    expect(screen.getAllByText('Quote').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In Production').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ready to Ship').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0)
  })

  it('renders cancelled state correctly', () => {
    render(<StatusTimeline status="cancelled" />)
    
    expect(screen.getByText('Order Cancelled')).toBeInTheDocument()
  })

  it('renders compact timeline', () => {
    const { container } = render(<StatusTimeline status="shipped" compact />)
    
    // Compact view should show dots instead of labels
    expect(screen.queryByText('Quote')).not.toBeInTheDocument()
    
    // Should have the wrapper element
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders without labels when showLabels is false', () => {
    render(<StatusTimeline status="pending" showLabels={false} />)
    
    // Labels should not be visible
    expect(screen.queryByText('Quote')).not.toBeInTheDocument()
    expect(screen.queryByText('Approved')).not.toBeInTheDocument()
  })

  it('handles quote status', () => {
    render(<StatusTimeline status="quote" />)
    expect(screen.getAllByText('Quote').length).toBeGreaterThan(0)
  })

  it('handles completed status', () => {
    render(<StatusTimeline status="completed" />)
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0)
  })

  it('handles delivered status', () => {
    render(<StatusTimeline status="delivered" />)
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0)
  })

  it('handles invoice_paid status', () => {
    render(<StatusTimeline status="invoice_paid" />)
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0)
  })

  it('handles payment_due status', () => {
    render(<StatusTimeline status="payment_due" />)
    expect(screen.getAllByText('In Production').length).toBeGreaterThan(0)
  })
})

describe('OrderCard Component', () => {
  const mockViewDetails = vi.fn()

  beforeEach(() => {
    mockViewDetails.mockClear()
  })

  it('renders order information correctly', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} />
      </BrowserRouter>
    )
    
    // Order number
    expect(screen.getByText('#12345')).toBeInTheDocument()
    
    // Status badge
    expect(screen.getByText('In Production')).toBeInTheDocument()
    
    // Order nickname
    expect(screen.getByText('Company Event Shirts')).toBeInTheDocument()
    
    // Total
    expect(screen.getByText('$118.50')).toBeInTheDocument()
    
    // Customer name
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Outstanding balance
    expect(screen.getByText('Balance: $68.50')).toBeInTheDocument()
  })

  it('renders view button and handles click', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} onViewDetails={mockViewDetails} />
      </BrowserRouter>
    )
    
    const viewButton = screen.getByRole('button', { name: /view/i })
    expect(viewButton).toBeInTheDocument()
    
    fireEvent.click(viewButton)
    expect(mockViewDetails).toHaveBeenCalledWith(1)
  })

  it('renders compact version correctly', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} compact />
      </BrowserRouter>
    )
    
    // Order number should still be visible
    expect(screen.getByText('#12345')).toBeInTheDocument()
    
    // Status badge visible
    expect(screen.getByText('In Production')).toBeInTheDocument()
    
    // Total visible
    expect(screen.getByText('$118.50')).toBeInTheDocument()
    
    // Items count visible
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })

  it('shows timeline when showTimeline is true', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} showTimeline />
      </BrowserRouter>
    )
    
    // The timeline component should be rendered
    // Check for timeline elements
    const container = document.querySelector('[class*="border-t"]')
    expect(container).toBeInTheDocument()
  })

  it('renders correct status colors for different statuses', () => {
    const statuses: OrderStatus[] = [
      'quote',
      'pending',
      'in_production',
      'ready_to_ship',
      'shipped',
      'delivered',
      'completed',
      'cancelled',
      'invoice_paid',
      'payment_due'
    ]
    
    statuses.forEach(status => {
      const orderWithStatus = {
        ...mockOrder,
        attributes: { ...mockOrder.attributes, status }
      }
      
      const { unmount } = render(
        <BrowserRouter>
          <OrderCard order={orderWithStatus} />
        </BrowserRouter>
      )
      
      // Verify badge is rendered with correct text
      const statusText = status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      expect(screen.getByText(statusText)).toBeInTheDocument()
      
      unmount()
    })
  })

  it('shows line items count correctly', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('shows due date when available', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} />
      </BrowserRouter>
    )
    
    // Due date should be displayed
    expect(screen.getByText('Dec 5, 2025')).toBeInTheDocument()
  })

  it('does not show outstanding balance when paid in full', () => {
    const paidOrder = {
      ...mockOrder,
      attributes: {
        ...mockOrder.attributes,
        totals: {
          ...mockOrder.attributes.totals,
          amountPaid: 118.5,
          amountOutstanding: 0
        }
      }
    }
    
    render(
      <BrowserRouter>
        <OrderCard order={paidOrder} />
      </BrowserRouter>
    )
    
    expect(screen.queryByText(/Balance:/i)).not.toBeInTheDocument()
  })
})

describe('OrderCard Accessibility', () => {
  it('view button is accessible', () => {
    render(
      <BrowserRouter>
        <OrderCard order={mockOrder} />
      </BrowserRouter>
    )
    
    const viewButton = screen.getByRole('button', { name: /view/i })
    expect(viewButton).toBeInTheDocument()
  })
})
