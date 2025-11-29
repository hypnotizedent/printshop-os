/**
 * Payments API Client
 * Communicates with Strapi payments endpoints
 */

import type { OrderPayment, PaymentFormData, PaymentsDashboardSummary, OutstandingOrderSummary } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

interface StrapiPaymentResponse {
  data: {
    id: number;
    documentId: string;
    amount: number;
    status: string;
    paymentType?: string;
    paymentMethod: string;
    referenceNumber?: string;
    paymentDate?: string;
    recordedBy?: string;
    notes?: string;
    paidAt?: string;
    createdAt: string;
  };
}

interface StrapiPaymentsListResponse {
  data: Array<{
    id: number;
    documentId: string;
    amount: number;
    status: string;
    paymentType?: string;
    paymentMethod: string;
    referenceNumber?: string;
    paymentDate?: string;
    recordedBy?: string;
    notes?: string;
    paidAt?: string;
    createdAt: string;
  }>;
  meta?: {
    pagination?: {
      total: number;
    };
  };
}

interface StrapiOrderResponse {
  data: {
    id: number;
    documentId: string;
    orderNumber: string;
    totalAmount: number;
    amountPaid: number;
    amountOutstanding: number;
    dueDate?: string;
    customer?: {
      id: number;
      documentId: string;
      name: string;
    };
  };
}

/**
 * Record a new payment for an order
 */
export async function recordPayment(
  orderDocumentId: string,
  payment: PaymentFormData,
  recordedBy: string = 'Staff'
): Promise<{ success: boolean; payment?: OrderPayment; error?: string }> {
  try {
    // Create the payment record
    const paymentRes = await fetch(`${API_BASE}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          order: orderDocumentId,
          amount: payment.amount,
          status: 'paid',
          paymentType: 'balance',
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber || null,
          paymentDate: payment.paymentDate,
          recordedBy: recordedBy,
          notes: payment.notes || null,
          paidAt: new Date().toISOString(),
        },
      }),
    });

    if (!paymentRes.ok) {
      const error = await paymentRes.json();
      return { 
        success: false, 
        error: error.error?.message || 'Failed to record payment' 
      };
    }

    const paymentData: StrapiPaymentResponse = await paymentRes.json();

    // Fetch the current order to update amountPaid and amountOutstanding
    const orderRes = await fetch(`${API_BASE}/api/orders/${orderDocumentId}`);
    if (orderRes.ok) {
      const orderData: StrapiOrderResponse = await orderRes.json();
      const order = orderData.data;
      
      const newAmountPaid = (order.amountPaid || 0) + payment.amount;
      const newAmountOutstanding = Math.max(0, (order.totalAmount || 0) - newAmountPaid);

      // Update the order with new payment amounts
      await fetch(`${API_BASE}/api/orders/${orderDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            amountPaid: newAmountPaid,
            amountOutstanding: newAmountOutstanding,
          },
        }),
      });
    }

    const p = paymentData.data;
    return {
      success: true,
      payment: {
        id: p.id.toString(),
        documentId: p.documentId,
        amount: p.amount,
        status: p.status as OrderPayment['status'],
        paymentType: p.paymentType as OrderPayment['paymentType'],
        paymentMethod: p.paymentMethod as OrderPayment['paymentMethod'],
        referenceNumber: p.referenceNumber,
        paymentDate: p.paymentDate,
        recordedBy: p.recordedBy,
        notes: p.notes,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      },
    };
  } catch (error) {
    console.error('Record payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error recording payment',
    };
  }
}

/**
 * Get all payments for a specific order
 */
export async function getPayments(orderDocumentId: string): Promise<OrderPayment[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/payments?filters[order][documentId][$eq]=${orderDocumentId}&sort=createdAt:desc`
    );

    if (!res.ok) {
      console.error('Failed to fetch payments');
      return [];
    }

    const data: StrapiPaymentsListResponse = await res.json();
    
    return (data.data || []).map((p) => ({
      id: p.id.toString(),
      documentId: p.documentId,
      amount: p.amount,
      status: p.status as OrderPayment['status'],
      paymentType: p.paymentType as OrderPayment['paymentType'],
      paymentMethod: p.paymentMethod as OrderPayment['paymentMethod'],
      referenceNumber: p.referenceNumber,
      paymentDate: p.paymentDate,
      recordedBy: p.recordedBy,
      notes: p.notes,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    }));
  } catch (error) {
    console.error('Get payments error:', error);
    return [];
  }
}

/**
 * Get all orders with outstanding balances
 */
export async function getOutstandingOrders(): Promise<OutstandingOrderSummary[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/orders?filters[amountOutstanding][$gt]=0&populate=customer&sort=amountOutstanding:desc&pagination[limit]=100`
    );

    if (!res.ok) {
      console.error('Failed to fetch outstanding orders');
      return [];
    }

    interface OrderListItem {
      id: number;
      documentId: string;
      orderNumber: string;
      totalAmount: number;
      amountPaid: number;
      amountOutstanding: number;
      dueDate?: string;
      customer?: {
        id: number;
        documentId: string;
        name: string;
      };
    }

    const data: { data: OrderListItem[] } = await res.json();
    
    return (data.data || []).map((o) => ({
      id: o.id.toString(),
      documentId: o.documentId,
      orderNumber: o.orderNumber,
      customerName: o.customer?.name || 'Unknown Customer',
      totalAmount: o.totalAmount || 0,
      amountPaid: o.amountPaid || 0,
      amountOutstanding: o.amountOutstanding || 0,
      dueDate: o.dueDate,
    }));
  } catch (error) {
    console.error('Get outstanding orders error:', error);
    return [];
  }
}

/**
 * Get payments dashboard summary
 */
export async function getPaymentsSummary(): Promise<PaymentsDashboardSummary> {
  try {
    // Get outstanding orders
    const outstandingOrders = await getOutstandingOrders();
    const totalOutstanding = outstandingOrders.reduce(
      (sum, o) => sum + (o.amountOutstanding || 0),
      0
    );

    // Get overdue orders (due date in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = outstandingOrders.filter((o) => {
      if (!o.dueDate) return false;
      const dueDate = new Date(o.dueDate);
      return dueDate < today;
    }).length;

    // Get payments this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekPaymentsRes = await fetch(
      `${API_BASE}/api/payments?filters[status][$eq]=paid&filters[createdAt][$gte]=${weekAgo.toISOString()}`
    );
    let paymentsThisWeek = 0;
    if (weekPaymentsRes.ok) {
      const weekPaymentsData: StrapiPaymentsListResponse = await weekPaymentsRes.json();
      paymentsThisWeek = (weekPaymentsData.data || []).reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
    }

    // Get payments this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthPaymentsRes = await fetch(
      `${API_BASE}/api/payments?filters[status][$eq]=paid&filters[createdAt][$gte]=${monthAgo.toISOString()}`
    );
    let paymentsThisMonth = 0;
    if (monthPaymentsRes.ok) {
      const monthPaymentsData: StrapiPaymentsListResponse = await monthPaymentsRes.json();
      paymentsThisMonth = (monthPaymentsData.data || []).reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
    }

    return {
      totalOutstanding,
      paymentsThisWeek,
      paymentsThisMonth,
      overdueCount,
      outstandingOrders: outstandingOrders.slice(0, 5), // Top 5 for dashboard
    };
  } catch (error) {
    console.error('Get payments summary error:', error);
    return {
      totalOutstanding: 0,
      paymentsThisWeek: 0,
      paymentsThisMonth: 0,
      overdueCount: 0,
      outstandingOrders: [],
    };
  }
}
