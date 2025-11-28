/**
 * ProductionStats Component
 * Shows today's production statistics at a glance
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardText, Clock, CheckCircle, Warning, ArrowClockwise } from '@phosphor-icons/react';
import type { ProductionStats as ProductionStatsType } from './types';
import { cn } from '@/lib/utils';

interface ProductionStatsProps {
  stats: ProductionStatsType;
  isRefreshing?: boolean;
}

export function ProductionStats({ stats, isRefreshing }: ProductionStatsProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const statCards = [
    {
      label: 'Due Today',
      value: stats.totalJobsDueToday,
      icon: ClipboardText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'In Queue',
      value: stats.jobsInQueue,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'In Progress',
      value: stats.jobsInProgress,
      icon: ArrowClockwise,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Completed',
      value: stats.jobsCompleted,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Today&apos;s Production</h2>
          {stats.rushOrderCount > 0 && (
            <Badge className="bg-red-500 text-white gap-1">
              <Warning size={14} weight="fill" />
              {stats.rushOrderCount} Rush Order{stats.rushOrderCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing && (
            <ArrowClockwise size={16} className="animate-spin" />
          )}
          <span>Last updated: {formatTime(stats.lastRefreshed)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 py-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <Icon size={24} weight="duotone" className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
