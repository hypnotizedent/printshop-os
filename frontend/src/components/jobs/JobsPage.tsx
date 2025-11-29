import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MagnifyingGlass, Plus, Funnel, CalendarBlank, FileText, Warning } from "@phosphor-icons/react"
import { PrintLabelButton } from "@/components/labels"
import { ProductionCalendar, JobQuickView } from "@/components/production"
import type { Job, JobStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface JobsPageProps {
  jobs: Job[]
  onUpdateJob: (jobId: string, updates: Partial<Job>) => void
  onViewOrder?: (orderId: string) => void
}

export function JobsPage({ jobs, onUpdateJob, onViewOrder }: JobsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState("kanban")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const columns = [
    { id: 'quote', label: 'Quote', color: 'border-yellow' },
    { id: 'design', label: 'Design', color: 'border-blue-500' },
    { id: 'prepress', label: 'Pre-press', color: 'border-purple-500' },
    { id: 'printing', label: 'Printing', color: 'border-cyan' },
    { id: 'finishing', label: 'Finishing', color: 'border-orange-500' },
    { id: 'delivery', label: 'Delivery', color: 'border-green-600' }
  ]

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job =>
    searchQuery === "" ||
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getJobsByStatus = (status: string) => {
    return filteredJobs.filter(job => job.status === status)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-destructive text-destructive-foreground',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-muted text-muted-foreground'
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  // Handle job click from calendar
  const handleJobClick = (job: Job) => {
    setSelectedJob(job)
    setIsQuickViewOpen(true)
  }

  // Handle job reschedule from calendar drag and drop
  const handleJobReschedule = (jobId: string, newDate: string) => {
    onUpdateJob(jobId, { dueDate: newDate })
  }

  // Handle status change from quick view
  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    onUpdateJob(jobId, { status: newStatus })
    setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null)
  }

  // Handle view full details
  const handleViewDetails = (jobId: string) => {
    setIsQuickViewOpen(false)
    onViewOrder?.(jobId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage your print jobs through their lifecycle</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} weight="bold" />
          Create Job
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search jobs by title or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Funnel size={18} />
          Filter
        </Button>
        <Tabs value={activeView} onValueChange={setActiveView} className="ml-auto">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <ProductionCalendar
          jobs={filteredJobs}
          onJobClick={handleJobClick}
          onJobReschedule={handleJobReschedule}
        />
      )}

      {/* Kanban View */}
      {activeView === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnJobs = getJobsByStatus(column.id)

            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="mb-4">
                  <div className={cn(
                    "flex items-center justify-between p-3 bg-card rounded-lg border-l-4",
                    column.color
                  )}>
                    <h3 className="font-semibold text-foreground">{column.label}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {columnJobs.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {columnJobs.map((job) => (
                    <Card 
                      key={job.id} 
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => onViewOrder?.(job.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {job.title}
                          </h4>
                          {job.priority === 'urgent' && (
                            <Warning size={18} weight="fill" className="text-destructive flex-shrink-0" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{job.customer}</p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText size={14} />
                            <span>{job.fileCount} files</span>
                            <span className="mx-1">•</span>
                            <span>{job.quantity} units</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarBlank size={14} />
                            <span>Due: {new Date(job.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <Badge className={getPriorityColor(job.priority)} variant="secondary">
                            {job.priority}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground ml-auto">
                            ${job.estimatedCost.toLocaleString()}
                          </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-2 flex justify-end">
                          <PrintLabelButton
                            job={{
                              jobId: job.id,
                              printavoId: job.id,
                              customerName: job.customer,
                              jobNickname: job.title,
                              quantity: job.quantity,
                              dueDate: job.dueDate,
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {columnJobs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                      No jobs in {column.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View - placeholder for future implementation */}
      {activeView === 'list' && (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
          List view coming soon - use Kanban or Calendar view
        </div>
      )}

      {/* Job Quick View Modal */}
      <JobQuickView
        job={selectedJob}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onStatusChange={handleStatusChange}
        onViewDetails={handleViewDetails}
      />
    </div>
  )
}
