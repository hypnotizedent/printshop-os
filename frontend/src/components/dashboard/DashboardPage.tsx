import { StatCard } from "./StatCard"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Package, CheckCircle, CurrencyDollar, Printer, Warning, Clock, Plus } from "@phosphor-icons/react"
import { PaymentsSummary } from "@/components/payments"
import type { DashboardStats, Job, Machine } from "@/lib/types"

interface DashboardPageProps {
  stats: DashboardStats
  recentJobs: Job[]
  machines: Machine[]
  onNavigate: (page: string) => void
  onViewOrder?: (orderId: string) => void
}

export function DashboardPage({ stats, recentJobs, machines, onNavigate, onViewOrder }: DashboardPageProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      printing: 'bg-cyan text-white',
      quote: 'bg-yellow/80 text-foreground',
      design: 'bg-blue-500 text-white',
      prepress: 'bg-purple-500 text-white',
      finishing: 'bg-orange-500 text-white',
      completed: 'bg-green-600 text-white',
      delivery: 'bg-cyan text-white'
    }
    return colors[status as keyof typeof colors] || 'bg-muted text-foreground'
  }

  const getMachineStatusColor = (status: string) => {
    const colors = {
      printing: 'text-cyan',
      idle: 'text-muted-foreground',
      maintenance: 'text-yellow',
      error: 'text-destructive',
      offline: 'text-muted-foreground'
    }
    return colors[status as keyof typeof colors] || 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your shop overview.</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} weight="bold" />
          New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          change={12}
          color="primary"
          icon={<Package size={24} weight="fill" />}
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          change={8}
          color="cyan"
          icon={<CheckCircle size={24} weight="fill" />}
        />
        <StatCard
          title="Revenue (MTD)"
          value={`$${stats.revenue.toLocaleString()}`}
          change={15}
          color="magenta"
          icon={<CurrencyDollar size={24} weight="fill" />}
        />
        <StatCard
          title="Machines Online"
          value={`${stats.machinesOnline}/8`}
          color="cyan"
          icon={<Printer size={24} weight="fill" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Jobs</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('jobs')}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onViewOrder?.(job.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.priority === 'urgent' && (
                      <Warning size={18} weight="fill" className="text-destructive" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{job.quantity} units</p>
                  <p className="text-xs text-muted-foreground">Due: {new Date(job.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="w-24">
                  <Progress value={job.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">{job.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Machines</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('machines')}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {machines.map((machine) => (
              <div key={machine.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer size={18} weight="fill" className={getMachineStatusColor(machine.status)} />
                    <span className="font-medium text-foreground text-sm">{machine.name}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {machine.status}
                  </span>
                </div>
                <Progress value={machine.utilization} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{machine.utilization}% utilization</span>
                  {machine.currentJob && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      2h left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payments Summary Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PaymentsSummary onViewOrder={onViewOrder} />
        </div>
      </div>

      {stats.lowStockItems > 0 && (
        <Card className="p-4 bg-yellow/10 border-yellow">
          <div className="flex items-center gap-3">
            <Warning size={24} weight="fill" className="text-yellow" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
              <p className="text-sm text-muted-foreground">
                {stats.lowStockItems} items are below reorder level
              </p>
            </div>
            <Button variant="outline" size="sm">
              View Inventory
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
