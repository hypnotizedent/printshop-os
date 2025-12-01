/**
 * Printavo to Strapi Data Mapper
 * Transforms Printavo order format to Strapi collection format with comprehensive validation
 */

import {
  StrapiOrder,
  StrapiCustomer,
  StrapiAddress,
  StrapiLineItem,
  StrapiTotals,
  StrapiTimeline,
  OrderStatus,
  STATE_ABBREVIATIONS,
  validateStrapiOrder,
  isValidEmail,
} from './strapi-schema';

/**
 * Printavo order structure from API
 */
export interface PrintavoOrder {
  id: number;
  customer: {
    full_name: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    email: string;
    customer_id?: number;
  };
  customer_id?: number;
  order_addresses_attributes: PrintavoAddress[];
  lineitems_attributes: PrintavoLineItem[];
  order_fees_attributes?: PrintavoFee[];
  order_total: number;
  order_subtotal?: number;
  sales_tax?: number;
  discount?: number;
  amount_paid?: number;
  amount_outstanding?: number;
  total_untaxed?: number;
  orderstatus: {
    name: string;
    color?: string;
  };
  due_date?: string;
  customer_due_date?: string;
  payment_due_date?: string;
  created_at: string;
  updated_at: string;
  order_nickname?: string;
  public_hash?: string;
  production_notes?: string;
  notes?: string;
  approved?: boolean;
  stats?: {
    paid?: boolean;
  };
}

/**
 * Printavo address structure
 */
export interface PrintavoAddress {
  id?: number;
  name: string;
  customer_name?: string;
  company_name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  state_iso?: string;
  country?: string;
  country_iso?: string;
  zip: string;
}

/**
 * Printavo line item structure
 */
export interface PrintavoLineItem {
  id: number;
  style_description: string;
  category?: string;
  total_quantities: number;
  unit_cost: number;
  taxable: boolean;
  goods_status?: string;
  style_number?: string;
  color?: string;
  size_other?: number;
  size_xs?: number;
  size_s?: number;
  size_m?: number;
  size_l?: number;
  size_xl?: number;
  size_2xl?: number;
  size_3xl?: number;
}

/**
 * Printavo fee structure
 */
export interface PrintavoFee {
  id: number;
  description: string;
  amount: number;
  taxable: boolean;
}

/**
 * Mapper error with context information
 */
export class PrintavoMapperError extends Error {
  constructor(
    public readonly orderId: number,
    message: string,
    public readonly field: string,
    public readonly value: any,
  ) {
    super(`Error mapping Printavo order ${orderId}.${field}: ${message}`);
    this.name = 'PrintavoMapperError';
  }
}

/**
 * Maps Printavo order status to Strapi OrderStatus enum
 *
 * @param printavoStatus - Status name from Printavo
 * @returns Corresponding OrderStatus enum value
 * @throws PrintavoMapperError if status is unknown
 */
export function mapOrderStatus(printavoStatus: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    QUOTE: OrderStatus.QUOTE,
    'AWAITING APPROVAL': OrderStatus.PENDING,
    'APPROVED FOR PRODUCTION': OrderStatus.IN_PRODUCTION,
    'IN PRODUCTION': OrderStatus.IN_PRODUCTION,
    'READY TO SHIP': OrderStatus.READY_TO_SHIP,
    SHIPPED: OrderStatus.SHIPPED,
    DELIVERED: OrderStatus.DELIVERED,
    COMPLETED: OrderStatus.COMPLETED,
    CANCELLED: OrderStatus.CANCELLED,
    'INVOICE PAID': OrderStatus.INVOICE_PAID,
    'PAYMENT DUE': OrderStatus.PAYMENT_DUE,
  };

  const normalizedStatus = printavoStatus.toUpperCase().trim();
  const mapped = statusMap[normalizedStatus];

  if (!mapped) {
    // Default to pending for unknown statuses
    return OrderStatus.PENDING;
  }

  return mapped;
}

/**
 * Normalizes state name to ISO abbreviation
 *
 * @param state - State name or abbreviation
 * @returns Two-letter state abbreviation or original if not found
 */
export function normalizeState(state: string): string {
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();

  const trimmed = state.trim();
  const found = STATE_ABBREVIATIONS[trimmed];
  return found || trimmed.toUpperCase().substring(0, 2);
}

/**
 * Extracts address by type from order addresses
 *
 * @param addresses - Array of addresses from Printavo order
 * @param type - Address type to find (e.g., "Customer Shipping", "Customer Billing")
 * @returns Address or undefined if not found
 */
export function extractAddressByType(
  addresses: PrintavoAddress[],
  type: string,
): PrintavoAddress | undefined {
  return addresses.find((addr) => addr.name.toLowerCase() === type.toLowerCase());
}

/**
 * Converts PrintavoAddress to StrapiAddress
 *
 * @param address - Printavo address
 * @returns Converted Strapi address
 * @throws Error if required fields are missing
 */
export function convertAddress(address: PrintavoAddress): StrapiAddress {
  const street = (address.address1 || '').trim();
  const street2 = (address.address2 || '').trim();
  const city = (address.city || '').trim();
  const state = normalizeState(address.state_iso || address.state || '');
  const zip = (address.zip || '').trim();

  if (!street || !city || !state || !zip) {
    throw new Error(
      `Address missing required fields. street: ${!!street}, city: ${!!city}, state: ${!!state}, zip: ${!!zip}`,
    );
  }

  return {
    street,
    ...(street2 && { street2 }),
    city,
    state,
    zip,
    country: address.country_iso || address.country || 'US',
  };
}

/**
 * Converts PrintavoLineItem to StrapiLineItem
 *
 * @param item - Printavo line item
 * @returns Converted Strapi line item
 */
export function convertLineItem(item: PrintavoLineItem): StrapiLineItem {
  const quantity = item.total_quantities || 0;
  const unitCost = item.unit_cost || 0;
  const total = quantity * unitCost;

  return {
    id: String(item.id),
    description: (item.style_description || '').trim(),
    category: (item.category || '').trim() || undefined,
    quantity,
    unitCost,
    taxable: item.taxable === true,
    total,
  };
}

/**
 * Converts PrintavoCustomer to StrapiCustomer
 *
 * @param customer - Printavo customer
 * @returns Converted Strapi customer
 * @throws Error if email is invalid
 */
export function convertCustomer(customer: PrintavoOrder['customer']): StrapiCustomer {
  const name = (customer.full_name || '').trim();
  const email = (customer.email || '').trim();

  if (!email || !isValidEmail(email)) {
    throw new Error(`Invalid email: "${email}"`);
  }

  if (!name) {
    throw new Error('Customer name is required');
  }

  return {
    name,
    email,
    ...(customer.company && customer.company.trim() && { company: customer.company.trim() }),
    ...(customer.first_name && { firstName: customer.first_name.trim() }),
    ...(customer.last_name && { lastName: customer.last_name.trim() }),
  };
}

/**
 * Calculates totals from order data
 *
 * @param order - Printavo order
 * @returns Strapi totals object
 */
export function calculateTotals(order: PrintavoOrder): StrapiTotals {
  const subtotal = Math.max(order.order_subtotal ?? 0, 0);
  const tax = Math.max(order.sales_tax ?? 0, 0);
  const discount = Math.max(order.discount ?? 0, 0);

  // Calculate fees total
  const fees = (order.order_fees_attributes ?? []).reduce((sum, fee) => {
    return sum + Math.max(fee.amount ?? 0, 0);
  }, 0);

  const total = Math.max(order.order_total ?? 0, 0);
  const amountPaid = Math.max(order.amount_paid ?? 0, 0);
  const amountOutstanding = Math.max(order.amount_outstanding ?? total - amountPaid, 0);

  return {
    subtotal,
    tax,
    discount,
    shipping: 0, // Shipping not in Printavo data
    fees,
    total,
    amountPaid,
    amountOutstanding,
  };
}

/**
 * Maps Printavo timeline dates to Strapi timeline
 *
 * @param order - Printavo order
 * @returns Strapi timeline object
 */
export function convertTimeline(order: PrintavoOrder): StrapiTimeline {
  const createdAt = order.created_at || new Date().toISOString();
  const updatedAt = order.updated_at || createdAt;

  return {
    createdAt,
    updatedAt,
    ...(order.due_date && { dueDate: order.due_date }),
    ...(order.customer_due_date && { customerDueDate: order.customer_due_date }),
    ...(order.payment_due_date && { paymentDueDate: order.payment_due_date }),
  };
}

/**
 * Main transformation function: converts Printavo order to Strapi order
 *
 * @param printavoOrder - Complete Printavo order object
 * @returns Transformed Strapi order ready for import
 * @throws PrintavoMapperError if transformation fails
 */
export function transformPrintavoToStrapi(printavoOrder: PrintavoOrder): StrapiOrder {
  try {
    // Convert customer
    let customer: StrapiCustomer;
    try {
      customer = convertCustomer(printavoOrder.customer);
    } catch (error) {
      throw new PrintavoMapperError(
        printavoOrder.id,
        error instanceof Error ? error.message : String(error),
        'customer',
        printavoOrder.customer,
      );
    }

    // Extract and convert addresses
    let billingAddress: StrapiAddress | undefined;
    let shippingAddress: StrapiAddress | undefined;

    const billingAddr = extractAddressByType(
      printavoOrder.order_addresses_attributes,
      'Customer Billing',
    );
    const shippingAddr = extractAddressByType(
      printavoOrder.order_addresses_attributes,
      'Customer Shipping',
    );

    if (billingAddr && billingAddr.address1) {
      try {
        billingAddress = convertAddress(billingAddr);
      } catch (error) {
        // Log but don't fail on missing billing address
        console.warn(
          `Warning mapping billing address for order ${printavoOrder.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    if (shippingAddr && shippingAddr.address1) {
      try {
        shippingAddress = convertAddress(shippingAddr);
      } catch (error) {
        // Log but don't fail on missing shipping address
        console.warn(
          `Warning mapping shipping address for order ${printavoOrder.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Convert line items
    const lineItems: StrapiLineItem[] = (printavoOrder.lineitems_attributes ?? []).map(
      (item, index) => {
        try {
          return convertLineItem(item);
        } catch (error) {
          console.warn(
            `Warning converting line item ${index} for order ${printavoOrder.id}:`,
            error instanceof Error ? error.message : String(error),
          );
          // Return a minimal line item on error
          return {
            id: String(item.id || index),
            description: item.style_description || 'Unknown item',
            quantity: item.total_quantities || 0,
            unitCost: item.unit_cost || 0,
            taxable: item.taxable === true,
            total: (item.total_quantities || 0) * (item.unit_cost || 0),
          };
        }
      },
    );

    // Map status
    const status = mapOrderStatus(printavoOrder.orderstatus.name);

    // Calculate totals
    const totals = calculateTotals(printavoOrder);

    // Convert timeline
    const timeline = convertTimeline(printavoOrder);

    // Construct Strapi order
    const strapiOrder: StrapiOrder = {
      printavoId: String(printavoOrder.id),
      customer,
      status,
      totals,
      lineItems,
      timeline,
      ...(billingAddress && { billingAddress }),
      ...(shippingAddress && { shippingAddress }),
      ...(printavoOrder.order_nickname && { orderNickname: printavoOrder.order_nickname }),
      ...(printavoOrder.public_hash && { publicHash: printavoOrder.public_hash }),
      ...(printavoOrder.production_notes && { productionNotes: printavoOrder.production_notes }),
      ...(printavoOrder.notes && { notes: printavoOrder.notes }),
      ...(typeof printavoOrder.approved === 'boolean' && { approved: printavoOrder.approved }),
      published: true,
    };

    // Validate transformed order
    const validation = validateStrapiOrder(strapiOrder);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    return strapiOrder;
  } catch (error) {
    if (error instanceof PrintavoMapperError) {
      throw error;
    }
    throw new PrintavoMapperError(
      printavoOrder.id,
      error instanceof Error ? error.message : String(error),
      'general',
      null,
    );
  }
}

/**
 * Batch transform multiple Printavo orders to Strapi format
 *
 * @param orders - Array of Printavo orders
 * @returns Object with successful transformations and errors
 */
export interface BatchTransformResult {
  successful: StrapiOrder[];
  errors: Array<{
    orderId: number;
    error: string;
  }>;
}

export function transformPrintavoOrdersBatch(orders: PrintavoOrder[]): BatchTransformResult {
  const successful: StrapiOrder[] = [];
  const errors: Array<{ orderId: number; error: string }> = [];

  for (const order of orders) {
    try {
      const transformed = transformPrintavoToStrapi(order);
      successful.push(transformed);
    } catch (error) {
      errors.push({
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { successful, errors };
}

// ============================================================================
// Printavo v2 GraphQL API Transformers
// ============================================================================

/**
 * Printavo v2 API Types
 */
export interface PrintavoV2Address {
  id: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface PrintavoV2Contact {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface PrintavoV2Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  addresses?: PrintavoV2Address[];
  contacts?: PrintavoV2Contact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2LineItem {
  id: string;
  description?: string;
  color?: string;
  quantity?: number;
  items?: number;
  price?: number;
  category?: string;
  itemNumber?: string;
  taxable?: boolean;
}

export interface PrintavoV2LineItemGroup {
  id: string;
  position?: number;
  lineItems?: PrintavoV2LineItem[];
}

export interface PrintavoV2Payment {
  id: string;
  amount?: number;
  paymentMethod?: string;
  createdAt?: string;
  note?: string;
}

export interface PrintavoV2Order {
  id: string;
  visualId?: string;
  orderNumber?: string;
  nickname?: string;
  status?: { id: string; name?: string; color?: string };
  productionStatus?: string;
  customerDueAt?: string;
  inHandsDate?: string;
  dueAt?: string;
  total?: number;
  subtotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  amountPaid?: number;
  amountOutstanding?: number;
  customer?: { id: string; company?: string; email?: string };
  lineItemGroups?: PrintavoV2LineItemGroup[];
  tasks?: Array<{
    id: string;
    name?: string;
    description?: string;
    dueAt?: string;
    completedAt?: string;
  }>;
  payments?: PrintavoV2Payment[];
  createdAt?: string;
  updatedAt?: string;
  productionNote?: string;
  customerNote?: string;
}

export interface PrintavoV2Quote {
  id: string;
  visualId?: string;
  status?: { id: string; name?: string };
  total?: number;
  expiresAt?: string;
  customer?: { id: string; company?: string; email?: string };
  lineItemGroups?: PrintavoV2LineItemGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2Invoice {
  id: string;
  invoiceNumber?: string;
  visualId?: string;
  status?: { id: string; name?: string };
  total?: number;
  paidAmount?: number;
  amountPaid?: number;
  amountOutstanding?: number;
  dueDate?: string;
  dueAt?: string;
  order?: { id: string; visualId?: string };
  payments?: PrintavoV2Payment[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Transform Printavo v2 customer to Strapi format
 */
export function transformPrintavoV2Customer(customer: PrintavoV2Customer): Record<string, unknown> {
  // Build full name from first/last or use company
  const fullName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
    customer.company ||
    'Unknown Customer';

  // Get primary contact email if customer email is missing
  const email =
    customer.email ||
    customer.contacts?.find((c) => c.email)?.email ||
    `no-email-${customer.id}@printavo.local`;

  // Get primary address if available
  const primaryAddress = customer.addresses?.[0];

  const result: Record<string, unknown> = {
    printavoId: customer.id,
    name: fullName,
    email: email,
    published: true,
  };

  if (customer.firstName) {
    result.firstName = customer.firstName;
  }

  if (customer.lastName) {
    result.lastName = customer.lastName;
  }

  if (customer.company) {
    result.company = customer.company;
  }

  if (customer.phone) {
    result.phone = customer.phone;
  }

  if (primaryAddress) {
    if (primaryAddress.address1) {
      result.address1 = primaryAddress.address1;
    }
    if (primaryAddress.address2) {
      result.address2 = primaryAddress.address2;
    }
    if (primaryAddress.city) {
      result.city = primaryAddress.city;
    }
    if (primaryAddress.state) {
      result.state = normalizeState(primaryAddress.state);
    }
    if (primaryAddress.zip) {
      result.zip = primaryAddress.zip;
    }
    if (primaryAddress.country) {
      result.country = primaryAddress.country;
    }
  }

  if (customer.createdAt) {
    result.createdAt = customer.createdAt;
  }

  if (customer.updatedAt) {
    result.updatedAt = customer.updatedAt;
  }

  return result;
}

/**
 * Map Printavo v2 status name to OrderStatus enum
 */
export function mapV2OrderStatus(statusName?: string): OrderStatus {
  if (!statusName) return OrderStatus.PENDING;

  const statusMap: Record<string, OrderStatus> = {
    QUOTE: OrderStatus.QUOTE,
    'AWAITING APPROVAL': OrderStatus.PENDING,
    'APPROVED FOR PRODUCTION': OrderStatus.IN_PRODUCTION,
    'IN PRODUCTION': OrderStatus.IN_PRODUCTION,
    'READY TO SHIP': OrderStatus.READY_TO_SHIP,
    SHIPPED: OrderStatus.SHIPPED,
    DELIVERED: OrderStatus.DELIVERED,
    COMPLETED: OrderStatus.COMPLETED,
    COMPLETE: OrderStatus.COMPLETED,
    CANCELLED: OrderStatus.CANCELLED,
    CANCELED: OrderStatus.CANCELLED,
    'INVOICE PAID': OrderStatus.INVOICE_PAID,
    'PAYMENT DUE': OrderStatus.PAYMENT_DUE,
    'PAYMENT NEEDED': OrderStatus.PAYMENT_DUE,
  };

  const normalized = statusName.toUpperCase().trim();
  return statusMap[normalized] || OrderStatus.PENDING;
}

/**
 * Convert Printavo v2 line item groups to flat line items array
 */
export function convertV2LineItems(
  lineItemGroups?: PrintavoV2LineItemGroup[],
): StrapiLineItem[] {
  if (!lineItemGroups) return [];

  const items: StrapiLineItem[] = [];

  for (const group of lineItemGroups) {
    if (!group.lineItems) continue;

    for (const item of group.lineItems) {
      const quantity = item.items || item.quantity || 0;
      const unitCost = item.price || 0;

      items.push({
        id: item.id,
        description: item.description || 'Unknown Item',
        category: item.category || undefined,
        quantity,
        unitCost,
        taxable: item.taxable === true,
        total: quantity * unitCost,
      });
    }
  }

  return items;
}

/**
 * Transform Printavo v2 order to Strapi format
 */
export function transformPrintavoV2Order(order: PrintavoV2Order): Record<string, unknown> {
  const status = mapV2OrderStatus(order.status?.name);
  const lineItems = convertV2LineItems(order.lineItemGroups);

  // Calculate totals
  const subtotal = order.subtotal || lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = order.taxTotal || 0;
  const discount = order.discountTotal || 0;
  const total = order.total || subtotal + tax - discount;
  const amountPaid = order.amountPaid || 0;
  const amountOutstanding = order.amountOutstanding || total - amountPaid;

  const result: Record<string, unknown> = {
    printavoId: order.id,
    status,
    totals: {
      subtotal,
      tax,
      discount,
      shipping: 0,
      fees: 0,
      total,
      amountPaid,
      amountOutstanding,
    },
    lineItems,
    timeline: {
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      ...(order.customerDueAt && { customerDueDate: order.customerDueAt }),
      ...(order.dueAt && { dueDate: order.dueAt }),
    },
    published: true,
  };

  if (order.visualId) {
    result.visualId = order.visualId;
  }

  if (order.nickname) {
    result.orderNickname = order.nickname;
  }

  if (order.productionNote) {
    result.productionNotes = order.productionNote;
  }

  if (order.customerNote) {
    result.notes = order.customerNote;
  }

  // Store customer reference (will be resolved to Strapi ID by import script)
  if (order.customer) {
    result.customerPrintavoId = order.customer.id;
    result.customer = {
      name: order.customer.company || order.customer.email || 'Unknown',
      email: order.customer.email || `no-email-${order.customer.id}@printavo.local`,
    };
  }

  return result;
}

/**
 * Transform Printavo v2 quote to Strapi format
 */
export function transformPrintavoV2Quote(quote: PrintavoV2Quote): Record<string, unknown> {
  const lineItems = convertV2LineItems(quote.lineItemGroups);
  const total = quote.total || lineItems.reduce((sum, item) => sum + item.total, 0);

  const result: Record<string, unknown> = {
    printavoId: quote.id,
    status: 'quote',
    total,
    lineItems,
    createdAt: quote.createdAt || new Date().toISOString(),
    updatedAt: quote.updatedAt || quote.createdAt || new Date().toISOString(),
    published: true,
  };

  if (quote.visualId) {
    result.visualId = quote.visualId;
  }

  if (quote.expiresAt) {
    result.expiresAt = quote.expiresAt;
  }

  // Store customer reference
  if (quote.customer) {
    result.customerPrintavoId = quote.customer.id;
  }

  return result;
}

/**
 * Transform Printavo v2 invoice to Strapi format
 */
export function transformPrintavoV2Invoice(invoice: PrintavoV2Invoice): Record<string, unknown> {
  const total = invoice.total || 0;
  const paidAmount = invoice.paidAmount || invoice.amountPaid || 0;
  const amountOutstanding = invoice.amountOutstanding || total - paidAmount;

  const result: Record<string, unknown> = {
    printavoId: invoice.id,
    invoiceNumber: invoice.invoiceNumber || invoice.visualId || invoice.id,
    status: invoice.status?.name || 'pending',
    total,
    paidAmount,
    amountOutstanding,
    createdAt: invoice.createdAt || new Date().toISOString(),
    updatedAt: invoice.updatedAt || invoice.createdAt || new Date().toISOString(),
    published: true,
  };

  if (invoice.dueDate || invoice.dueAt) {
    result.dueDate = invoice.dueDate || invoice.dueAt;
  }

  // Store order reference
  if (invoice.order) {
    result.orderPrintavoId = invoice.order.id;
  }

  // Include payments summary
  if (invoice.payments && invoice.payments.length > 0) {
    result.paymentsCount = invoice.payments.length;
    result.payments = invoice.payments.map((p) => ({
      id: p.id,
      amount: p.amount || 0,
      createdAt: p.createdAt,
    }));
  }

  return result;
}
