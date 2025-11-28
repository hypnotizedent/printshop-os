/**
 * Production Board Types
 * Type definitions for the production job board
 */

export type ProductionStatus = 'queue' | 'in_progress' | 'quality_check' | 'complete';

export interface ProductionJob {
  id: string;
  documentId?: string;
  orderNumber: string;
  customerName: string;
  status: ProductionStatus;
  dueDate: string;
  isRush: boolean;
  lineItems: ProductionLineItem[];
  productionNotes?: string;
  createdAt: string;
  updatedAt: string;
  quantity: number;
  progress: number;
}

export interface ProductionLineItem {
  id: string;
  description: string;
  quantity: number;
  category?: string;
}

export interface ProductionColumn {
  id: ProductionStatus;
  label: string;
  color: string;
  bgColor: string;
}

export interface ProductionStats {
  totalJobsDueToday: number;
  jobsInQueue: number;
  jobsInProgress: number;
  jobsInQualityCheck: number;
  jobsCompleted: number;
  rushOrderCount: number;
  lastRefreshed: Date;
}

export const PRODUCTION_COLUMNS: ProductionColumn[] = [
  { id: 'queue', label: 'Queue', color: 'border-yellow-500', bgColor: 'bg-yellow-50' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-500', bgColor: 'bg-blue-50' },
  { id: 'quality_check', label: 'Quality Check', color: 'border-purple-500', bgColor: 'bg-purple-50' },
  { id: 'complete', label: 'Complete', color: 'border-green-500', bgColor: 'bg-green-50' },
];
