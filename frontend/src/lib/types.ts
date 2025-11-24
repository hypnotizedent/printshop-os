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
