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
