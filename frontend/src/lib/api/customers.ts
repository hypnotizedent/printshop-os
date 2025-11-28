const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export interface CustomerAPIResponse {
  id: number;
  documentId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  printavoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAPIResponse {
  id: number;
  documentId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  amountOutstanding: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithOrders extends CustomerAPIResponse {
  orders?: OrderAPIResponse[];
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
}

/**
 * Search customers with filters
 */
export async function searchCustomers(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<StrapiResponse<CustomerAPIResponse>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = options;
  
  const params = new URLSearchParams({
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'sort': `${sortBy}:${sortOrder}`,
  });

  // If there's a search query, add $or filters for name, email, company, phone
  if (query.trim()) {
    const searchTerm = query.trim();
    params.append('filters[$or][0][name][$containsi]', searchTerm);
    params.append('filters[$or][1][email][$containsi]', searchTerm);
    params.append('filters[$or][2][company][$containsi]', searchTerm);
    params.append('filters[$or][3][phone][$containsi]', searchTerm);
  }

  const response = await fetch(`${API_BASE}/api/customers?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to search customers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single customer by documentId with populated orders
 */
export async function getCustomerWithOrders(
  documentId: string
): Promise<StrapiSingleResponse<CustomerWithOrders>> {
  const params = new URLSearchParams({
    'populate': 'orders',
  });

  const response = await fetch(`${API_BASE}/api/customers/${documentId}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customer: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get recent customers (sorted by last updated)
 */
export async function getRecentCustomers(
  limit: number = 5
): Promise<StrapiResponse<CustomerAPIResponse>> {
  const params = new URLSearchParams({
    'pagination[limit]': limit.toString(),
    'sort': 'updatedAt:desc',
  });

  const response = await fetch(`${API_BASE}/api/customers?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recent customers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get customer orders by customer documentId
 */
export async function getCustomerOrders(
  customerDocumentId: string,
  options: {
    page?: number;
    pageSize?: number;
  } = {}
): Promise<StrapiResponse<OrderAPIResponse>> {
  const { page = 1, pageSize = 20 } = options;
  
  const params = new URLSearchParams({
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'filters[customer][documentId][$eq]': customerDocumentId,
    'sort': 'createdAt:desc',
  });

  const response = await fetch(`${API_BASE}/api/orders?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customer orders: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all customers with basic pagination
 */
export async function getCustomers(
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<StrapiResponse<CustomerAPIResponse>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = options;
  
  const params = new URLSearchParams({
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'sort': `${sortBy}:${sortOrder}`,
  });

  const response = await fetch(`${API_BASE}/api/customers?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.statusText}`);
  }

  return response.json();
}
