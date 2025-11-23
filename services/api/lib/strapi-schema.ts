/**
 * Strapi Collection Schema and Type Definitions
 * Defines the complete structure and validation rules for Strapi orders collection
 */

/**
 * State abbreviation mappings from full state names to ISO codes
 */
export const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

/**
 * Valid order statuses in Strapi
 */
export enum OrderStatus {
  QUOTE = 'quote',
  PENDING = 'pending',
  IN_PRODUCTION = 'in_production',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  INVOICE_PAID = 'invoice_paid',
  PAYMENT_DUE = 'payment_due',
}

/**
 * Customer information in Strapi format
 */
export interface StrapiCustomer {
  name: string;
  email: string;
  company?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Address information in Strapi format
 */
export interface StrapiAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

/**
 * Line item in Strapi format
 */
export interface StrapiLineItem {
  id: string;
  description: string;
  category?: string;
  quantity: number;
  unitCost: number;
  taxable: boolean;
  total: number;
}

/**
 * Order totals and financial summary
 */
export interface StrapiTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  fees: number;
  total: number;
  amountPaid: number;
  amountOutstanding: number;
}

/**
 * Order timeline with key dates
 */
export interface StrapiTimeline {
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  customerDueDate?: string;
  paymentDueDate?: string;
}

/**
 * Complete Strapi Order Collection document
 */
export interface StrapiOrder {
  documentId?: string;
  printavoId: string;
  customer: StrapiCustomer;
  billingAddress?: StrapiAddress;
  shippingAddress?: StrapiAddress;
  status: OrderStatus;
  totals: StrapiTotals;
  lineItems: StrapiLineItem[];
  timeline: StrapiTimeline;
  notes?: string;
  productionNotes?: string;
  orderNickname?: string;
  publicHash?: string;
  approved?: boolean;
  published?: boolean;
  createdBy?: any;
  updatedBy?: any;
}

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a Strapi Order object
 *
 * @param order - The order object to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateStrapiOrder(order: Partial<StrapiOrder>): ValidationResult {
  const errors: string[] = [];

  if (!order.printavoId) {
    errors.push('printavoId is required');
  }

  if (!order.customer) {
    errors.push('customer object is required');
  } else {
    if (!order.customer.name || order.customer.name.trim().length === 0) {
      errors.push('customer.name is required and cannot be empty');
    }
    if (!order.customer.email || order.customer.email.trim().length === 0) {
      errors.push('customer.email is required and cannot be empty');
    } else if (!isValidEmail(order.customer.email)) {
      errors.push('customer.email is not a valid email format');
    }
  }

  if (!order.status) {
    errors.push('status is required');
  } else if (!Object.values(OrderStatus).includes(order.status as OrderStatus)) {
    errors.push(`status must be one of: ${Object.values(OrderStatus).join(', ')}`);
  }

  if (!order.totals) {
    errors.push('totals object is required');
  } else {
    if (typeof order.totals.subtotal !== 'number' || order.totals.subtotal < 0) {
      errors.push('totals.subtotal must be a non-negative number');
    }
    if (typeof order.totals.total !== 'number' || order.totals.total < 0) {
      errors.push('totals.total must be a non-negative number');
    }
  }

  if (!Array.isArray(order.lineItems)) {
    errors.push('lineItems must be an array');
  }

  if (!order.timeline) {
    errors.push('timeline object is required');
  } else {
    if (!order.timeline.createdAt) {
      errors.push('timeline.createdAt is required');
    } else if (!isValidISODate(order.timeline.createdAt)) {
      errors.push('timeline.createdAt must be a valid ISO 8601 date string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 *
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates ISO 8601 date string
 *
 * @param dateString - Date string to validate
 * @returns true if date is valid ISO 8601 format, false otherwise
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Validates a Strapi Address object
 *
 * @param address - The address to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateAddress(address: Partial<StrapiAddress>): ValidationResult {
  const errors: string[] = [];

  if (!address.street || address.street.trim().length === 0) {
    errors.push('street is required and cannot be empty');
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push('city is required and cannot be empty');
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push('state is required and cannot be empty');
  }

  if (!address.zip || address.zip.trim().length === 0) {
    errors.push('zip is required and cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
