/**
 * JobDetail Component
 * Full job details displayed in a sidebar/sheet
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CalendarBlank,
  Package,
  User,
  Lightning,
  ClipboardText,
  ArrowRight,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import type { ProductionJob, ProductionStatus } from './types';
import { PRODUCTION_COLUMNS } from './types';

interface JobDetailProps {
  job: ProductionJob | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (jobId: string, newStatus: ProductionStatus) => void;
}

export function JobDetail({ job, open, onClose, onStatusChange }: JobDetailProps) {
  if (!job) return null;

  const currentColumnIndex = PRODUCTION_COLUMNS.findIndex(col => col.id === job.status);
  const canMoveBack = currentColumnIndex > 0;
  const canMoveForward = currentColumnIndex < PRODUCTION_COLUMNS.length - 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (status: ProductionStatus) => {
    switch (status) {
      case 'queue':
        return <Clock size={18} weight="fill" className="text-yellow-500" />;
      case 'in_progress':
        return <ArrowRight size={18} weight="fill" className="text-blue-500" />;
      case 'quality_check':
        return <MagnifyingGlass size={18} weight="fill" className="text-purple-500" />;
      case 'complete':
        return <CheckCircle size={18} weight="fill" className="text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: ProductionStatus) => {
    return PRODUCTION_COLUMNS.find(col => col.id === status)?.label || status;
  };

  const handleMoveBack = () => {
    if (canMoveBack) {
      const newStatus = PRODUCTION_COLUMNS[currentColumnIndex - 1].id;
      onStatusChange(job.id, newStatus);
    }
  };

  const handleMoveForward = () => {
    if (canMoveForward) {
      const newStatus = PRODUCTION_COLUMNS[currentColumnIndex + 1].id;
      onStatusChange(job.id, newStatus);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-xl">Order #{job.orderNumber}</SheetTitle>
            {job.isRush && (
              <Badge className="bg-red-500 text-white gap-1">
                <Lightning size={12} weight="fill" />
                Rush
              </Badge>
            )}
          </div>
          <SheetDescription>
            <span className="flex items-center gap-2">
              <User size={16} />
              {job.customerName}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Status Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(job.status)}
              <span className="font-semibold text-foreground">
                {getStatusLabel(job.status)}
              </span>
            </div>
            
            {/* Quick status navigation */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveBack}
                disabled={!canMoveBack}
                className="flex-1 gap-1"
              >
                <CaretLeft size={16} />
                {canMoveBack ? PRODUCTION_COLUMNS[currentColumnIndex - 1].label : 'Back'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleMoveForward}
                disabled={!canMoveForward}
                className="flex-1 gap-1"
              >
                {canMoveForward ? PRODUCTION_COLUMNS[currentColumnIndex + 1].label : 'Done'}
                <CaretRight size={16} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Due Date Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Due Date</h3>
            <div className="flex items-center gap-2 text-foreground">
              <CalendarBlank size={18} />
              <span>{formatDate(job.dueDate)}</span>
            </div>
          </div>

          <Separator />

          {/* Line Items Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Package size={16} />
              Line Items ({job.lineItems.length})
            </h3>
            <div className="space-y-2">
              {job.lineItems.map((item, index) => (
                <Card key={item.id || index} className="py-3">
                  <CardContent className="p-3 py-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{item.description}</p>
                        {item.category && (
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{item.quantity} pcs</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Production Notes Section */}
          {job.productionNotes && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <ClipboardText size={16} />
                  Production Notes
                </h3>
                <Card className="py-3">
                  <CardContent className="p-3 py-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {job.productionNotes}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Separator />
            </>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {formatDate(job.createdAt)} at {formatTime(job.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground">
                  {formatDate(job.updatedAt)} at {formatTime(job.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar for completed items */}
          {job.status === 'complete' && (
            <>
              <Separator />
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <CheckCircle size={48} weight="fill" className="text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-700">Job Completed!</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
