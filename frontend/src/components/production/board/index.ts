/**
 * Production Board Components
 * Export all production board related components
 */

export { ProductionBoard } from './ProductionBoard';
export { ProductionStats } from './ProductionStats';
export { JobCard } from './JobCard';
export { JobDetail } from './JobDetail';

export type {
  ProductionJob,
  ProductionLineItem,
  ProductionStatus,
  ProductionColumn,
  ProductionStats as ProductionStatsType,
} from './types';

export { PRODUCTION_COLUMNS } from './types';
