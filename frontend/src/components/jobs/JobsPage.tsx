import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MagnifyingGlass, Plus, Funnel, CalendarBlank, FileText, Warning, ArrowRight, ArrowLeft } from "@phosphor-icons/react"
import { PrintLabelButton } from "@/components/labels"
import { toast } from "sonner"
import { jobsApi } from "@/lib/api-client"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"

interface JobsPageProps {
  jobs: Job[]
  onUpdateJob: (jobId: string, updates: Partial<Job>) => void
  onViewOrder?: (orderId: string) => void
}

export function JobsPage({ jobs, onUpdateJob, onViewOrder }: JobsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState("kanban")
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  const columns = [
    { id: 'quote', label: 'Quote', color: 'border-yellow' },
    { id: 'design', label: 'Design', color: 'border-blue-500' },
    { id: 'prepress', label: 'Pre-press', color: 'border-purple-500' },
    { id: 'printing', label: 'Printing', color: 'border-cyan' },
    { id: 'finishing', label: 'Finishing', color: 'border-orange-500' },
    { id: 'delivery', label: 'Delivery', color: 'border-green-600' }
  ]

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job =>
      job.status === status &&
      (searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer.toLowerCase().includes(searchQuery.toLowerCase()))
    )
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

  // Get next/previous status for a job
  const getAdjacentStatus = (currentStatus: string, direction: 'next' | 'prev'): string | null => {
    const statusOrder = columns.map(c => c.id)
    const currentIndex = statusOrder.indexOf(currentStatus)
    if (currentIndex === -1) return null
    
    if (direction === 'next' && currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1]
    }
    if (direction === 'prev' && currentIndex > 0) {
      return statusOrder[currentIndex - 1]
    }
    return null
  }

  // Valid status values that match JobStatus type
  const validStatuses: Job['status'][] = ['quote', 'design', 'prepress', 'printing', 'finishing', 'delivery', 'completed', 'cancelled']
  
  // Type guard to check if a string is a valid JobStatus
  const isValidJobStatus = (status: string): status is Job['status'] => {
    return validStatuses.includes(status as Job['status'])
  }

  // Update job status in Strapi
  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    // Validate that newStatus is a valid JobStatus
    if (!isValidJobStatus(newStatus)) {
      toast.error('Invalid status', {
        description: `"${newStatus}" is not a valid job status`,
      })
      return
    }

    setUpdatingJobId(jobId)
    try {
      // The job id is used as the documentId for API calls
      // In a real app, you'd want to ensure jobs have proper documentId fields
      const result = await jobsApi.updateStatus(jobId, newStatus)
      
      if (result.success) {
        // Update local state via parent callback with validated status
        onUpdateJob(jobId, { status: newStatus })
        toast.success('Job status updated', {
          description: `Moved to ${columns.find(c => c.id === newStatus)?.label || newStatus}`,
        })
      } else {
        toast.error('Failed to update job status', {
          description: result.error || 'Please try again',
        })
      }
    } catch (error) {
      toast.error('Failed to update job status')
      console.error('Status update error:', error)
    } finally {
      setUpdatingJobId(null)
    }
  }

  // Handle direct status selection from dropdown
  const handleDirectStatusChange = async (jobId: string, newStatus: string) => {
    if (newStatus === jobs.find(j => j.id === jobId)?.status) return
    await handleStatusUpdate(jobId, newStatus)
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
          </TabsList>
        </Tabs>
      </div>

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
                      <div className="pt-2 flex items-center justify-between gap-2">
                        {/* Status navigation buttons */}
                        <div className="flex gap-1">
                          {getAdjacentStatus(job.status, 'prev') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              disabled={updatingJobId === job.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                const prevStatus = getAdjacentStatus(job.status, 'prev')
                                if (prevStatus) handleStatusUpdate(job.id, prevStatus)
                              }}
                            >
                              <ArrowLeft size={12} className="mr-1" />
                              {columns.find(c => c.id === getAdjacentStatus(job.status, 'prev'))?.label}
                            </Button>
                          )}
                          {getAdjacentStatus(job.status, 'next') && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              disabled={updatingJobId === job.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextStatus = getAdjacentStatus(job.status, 'next')
                                if (nextStatus) handleStatusUpdate(job.id, nextStatus)
                              }}
                            >
                              {columns.find(c => c.id === getAdjacentStatus(job.status, 'next'))?.label}
                              <ArrowRight size={12} className="ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {/* Status dropdown for direct selection */}
                          <Select
                            value={job.status}
                            onValueChange={(value) => {
                              handleDirectStatusChange(job.id, value)
                            }}
                          >
                            <SelectTrigger 
                              className="h-6 w-[100px] text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(col => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
    </div>
  )
}
