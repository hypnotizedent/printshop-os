/**
 * Shared Types for Production Dashboard API
 */

export interface User {
  id: string;
  username: string;
  role: 'operator' | 'supervisor' | 'admin';
  email?: string;
}

export interface JWTPayload extends User {
  iat?: number;
  exp?: number;
}

export interface Order {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  priority: number;
  service: 'screen' | 'dtg' | 'embroidery';
  quantity: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  currentStage?: ProductionStage;
  assignedMachine?: string;
  assignedEmployee?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
}

export type OrderStatus = 
  | 'pending_approval'
  | 'approved'
  | 'in_screen'
  | 'in_printing'
  | 'in_curing'
  | 'in_quality_check'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type ProductionStage = 
  | 'screen_setup'
  | 'printing'
  | 'curing'
  | 'quality_check'
  | 'packaging';

export interface Machine {
  id: string;
  name: string;
  type: 'screen_press' | 'dtg_printer' | 'embroidery_machine' | 'curing_station';
  status: 'idle' | 'running' | 'down' | 'maintenance';
  currentJobId?: string;
  utilizationPercent: number;
  lastMaintenance?: Date;
  uptime: number;
}

export interface Employee {
  id: string;
  name: string;
  status: 'clocked_in' | 'clocked_out' | 'break';
  currentJobId?: string;
  clockedInAt?: Date;
  productivity?: number;
  skillSet?: string[];
}

export interface QueueItem {
  order: Order;
  position: number;
  estimatedStartTime?: Date;
  blockers?: string[];
}

export interface Analytics {
  throughput: {
    jobsPerHour: number;
    jobsPerDay: number;
    jobsThisWeek: number;
  };
  cycleTime: {
    averagePerStage: Record<ProductionStage, number>;
    averageTotal: number;
  };
  utilization: {
    machines: Record<string, number>;
    averageUptime: number;
  };
  bottlenecks: {
    stage: ProductionStage;
    averageWaitTime: number;
    jobsWaiting: number;
  }[];
  quality: {
    defectRate: number;
    defectsByStage: Record<ProductionStage, number>;
  };
}

export interface WebSocketEvents {
  // Server to Client
  'order:status_changed': (data: { orderId: string; oldStatus: OrderStatus; newStatus: OrderStatus; timestamp: Date }) => void;
  'queue:updated': (data: { queue: QueueItem[]; timestamp: Date }) => void;
  'resource:allocated': (data: { resourceType: 'machine' | 'employee'; resourceId: string; orderId: string; timestamp: Date }) => void;
  'alert:bottleneck': (data: { stage: ProductionStage; jobsWaiting: number; averageWaitTime: number; timestamp: Date }) => void;
  'connection:authenticated': (data: { userId: string; timestamp: Date }) => void;
  'error': (data: { message: string; code?: string }) => void;

  // Client to Server
  'subscribe:orders': (data: { orderIds?: string[] }) => void;
  'update:status': (data: { orderId: string; newStatus: OrderStatus }) => void;
  'query:queue': (callback: (queue: QueueItem[]) => void) => void;
  'authenticate': (data: { token: string }) => void;
}

export interface RESTResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
