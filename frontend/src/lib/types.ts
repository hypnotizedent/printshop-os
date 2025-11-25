export type JobStatus = 'quote' | 'design' | 'prepress' | 'printing' | 'finishing' | 'delivery' | 'completed' | 'cancelled'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export type MachineStatus = 'idle' | 'printing' | 'maintenance' | 'error' | 'offline'

export interface Job {
  id: string
  title: string
  customer: string
  customerId: string
  status: JobStatus
  priority: Priority
  dueDate: string
  createdAt: string
  description: string
  quantity: number
  fileCount: number
  assignedMachine?: string
  estimatedCost: number
  progress: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  totalOrders: number
  totalRevenue: number
  lastOrderDate: string
  status: 'active' | 'inactive'
}

export interface Machine {
  id: string
  name: string
  type: string
  status: MachineStatus
  utilization: number
  currentJob?: string
  lastMaintenance: string
  nextMaintenance: string
  totalJobs: number
  uptime: number
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorderLevel: number
  costPerUnit: number
  supplier: string
  lastRestocked: string
}

export interface FileItem {
  id: string
  name: string
  path: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
  jobId?: string
  thumbnailUrl?: string
}

export interface DashboardStats {
  activeJobs: number
  completedToday: number
  revenue: number
  machinesOnline: number
  lowStockItems: number
  urgentJobs: number
}

<<<<<<< HEAD
<<<<<<< HEAD
// Customer Portal Types
export type OrderStatus = 'completed' | 'in-production' | 'shipped' | 'delivered' | 'cancelled'

export interface CustomerOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  date: string
  items: number
  trackingNumber?: string
}

export interface QuoteRequest {
  id: string
  quoteNumber: string
  status: 'pending' | 'approved' | 'rejected'
  description: string
  requestedDate: string
  estimatedTotal?: number
  expiresAt?: string
}

export interface CustomerNotification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  date: string
  read: boolean
  actionUrl?: string
}

export interface CustomerDashboardStats {
  ordersThisMonth: number
  pendingQuotes: number
  activeJobs: number
  totalSpentYTD: number
}

export interface CustomerUser {
  id: string
  name: string
  email: string
  company?: string
  avatar?: string
  role: 'customer'
}
<<<<<<< HEAD

// Billing & Invoicing Types
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Void'
export type PaymentStatus = 'Completed' | 'Pending' | 'Failed' | 'Refunded'
export type PaymentMethodType = 'Card' | 'Bank ACH' | 'PayPal'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Payment {
  id: string
  date: string
  amount: number
  paymentMethod: string
  status: PaymentStatus
  transactionId?: string
}

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  token: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  orderNumber: string
  invoiceDate: string
  dueDate: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  shipping: number
  total: number
  amountPaid: number
  balance: number
  lineItems: InvoiceItem[]
  paymentHistory: Payment[]
  customerName: string
  customerEmail: string
  customerAddress?: {
    street: string
    street2?: string
    city: string
    state: string
    zip: string
    country?: string
  }
}

export interface AccountBalance {
  totalOutstanding: number
  overdueAmount: number
  currentAmount: number
  invoiceCount: number
}
=======
>>>>>>> origin/copilot/build-customer-portal-dashboard
=======
// Order types for customer portal
export type OrderStatus = 
  | 'quote'
  | 'pending'
  | 'in_production'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'invoice_paid'
  | 'payment_due'

export interface OrderCustomer {
  name: string
  email: string
  company?: string
  firstName?: string
  lastName?: string
}

export interface OrderAddress {
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  country?: string
}

export interface OrderLineItem {
  id: string
  description: string
  category?: string
  quantity: number
  unitCost: number
  taxable: boolean
  total: number
}

export interface OrderTotals {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  fees: number
  total: number
  amountPaid: number
  amountOutstanding: number
}

export interface OrderTimeline {
  createdAt: string
  updatedAt: string
  dueDate?: string
  customerDueDate?: string
  paymentDueDate?: string
}

export interface Order {
  id: number
  attributes: {
    printavoId: string
    customer: OrderCustomer
    billingAddress?: OrderAddress
    shippingAddress?: OrderAddress
    status: OrderStatus
    totals: OrderTotals
    lineItems: OrderLineItem[]
    timeline: OrderTimeline
    notes?: string
    productionNotes?: string
    orderNickname?: string
    publicHash?: string
    approved?: boolean
  }
}

export interface OrderListResponse {
  data: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
>>>>>>> origin/copilot/add-order-history-view
=======
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TicketCategory = 'Order Issue' | 'Art Approval' | 'Shipping' | 'Billing' | 'General'

export interface TicketAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export interface TicketComment {
  id: string
  ticketId: string
  userId: string
  userType: 'customer' | 'staff'
  message: string
  isInternal: boolean
  createdAt: string
  attachments?: TicketAttachment[]
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  customerId: string
  customerName?: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  subject: string
  description: string
  orderNumber?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  assignedTo?: string
  comments?: TicketComment[]
  attachments?: TicketAttachment[]
}
>>>>>>> origin/copilot/build-support-ticketing-system
