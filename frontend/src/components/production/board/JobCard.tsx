/**
 * JobCard Component
 * Displays a single job card on the production board
 * Touch-friendly for production floor use
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarBlank, 
  Package, 
  Warning, 
  CaretRight,
  Lightning,
  NotePencil
} from '@phosphor-icons/react';
import type { ProductionJob } from './types';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: ProductionJob;
  onClick: (job: ProductionJob) => void;
  isDragging?: boolean;
}

export function JobCard({ job, onClick, isDragging }: JobCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = new Date(job.dueDate) < new Date() && job.status !== 'complete';

  return (
    <Card
      className={cn(
        'p-4 py-4 cursor-pointer transition-all duration-200 group',
        'hover:shadow-md hover:border-primary/50',
        'touch-manipulation select-none',
        isDragging && 'shadow-lg ring-2 ring-primary',
        job.isRush && 'border-l-4 border-l-red-500',
        isOverdue && 'bg-red-50/50'
      )}
      onClick={() => onClick(job)}
    >
      <div className="space-y-3">
        {/* Header with order number and rush indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-base">
              #{job.orderNumber}
            </span>
            {job.isRush && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 gap-1">
                <Lightning size={12} weight="fill" />
                Rush
              </Badge>
            )}
          </div>
          <CaretRight 
            size={20} 
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </div>

        {/* Customer name */}
        <p className="text-sm font-medium text-foreground truncate">
          {job.customerName}
        </p>

        {/* Line items preview */}
        {job.lineItems.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-0.5">
            {job.lineItems.slice(0, 2).map((item, index) => (
              <p key={item.id || index} className="truncate flex items-center gap-1">
                <Package size={14} className="flex-shrink-0" />
                {item.quantity}× {item.description}
              </p>
            ))}
            {job.lineItems.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{job.lineItems.length - 2} more items
              </p>
            )}
          </div>
        )}

        {/* Production notes */}
        {job.productionNotes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <NotePencil size={14} className="flex-shrink-0" />
            <span className="truncate">{job.productionNotes}</span>
          </div>
        )}

        {/* Footer with due date and quantity */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarBlank 
              size={16} 
              className={cn(
                isOverdue ? 'text-red-500' : 'text-muted-foreground'
              )} 
            />
            <span className={cn(
              isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
            )}>
              {isOverdue && <Warning size={14} className="inline mr-1" weight="fill" />}
              {formatDate(job.dueDate)}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {job.quantity} pcs
          </Badge>
        </div>
      </div>
    </Card>
  );
}
