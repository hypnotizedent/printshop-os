/**
 * Employee Dashboard
 * Filtered view showing ONLY jobs assigned to current employee
 * No pricing information, simplified job cards
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Printer,
  QrCode,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

// Types
interface EmployeeJob {
  id: string;
  jobNumber: string;
  customerFirstName: string;
  itemDescription: string;
  quantity: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'normal' | 'high' | 'urgent';
  machine?: string;
}

interface EmployeeStats {
  assignedJobs: number;
  completedToday: number;
  inProgress: number;
  currentMachine?: string;
}

// Mock data for employee jobs - will be replaced with API call
const mockEmployeeJobs: EmployeeJob[] = [
  {
    id: '1',
    jobNumber: 'JOB-2024-001',
    customerFirstName: 'John',
    itemDescription: 'Custom T-Shirts - Black, Size L',
    quantity: 50,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    priority: 'urgent',
    machine: 'DTG-01'
  },
  {
    id: '2',
    jobNumber: 'JOB-2024-002',
    customerFirstName: 'Sarah',
    itemDescription: 'Embroidered Polo Shirts - Navy',
    quantity: 25,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'normal'
  },
  {
    id: '3',
    jobNumber: 'JOB-2024-003',
    customerFirstName: 'Mike',
    itemDescription: 'Screen Print Hoodies - Red',
    quantity: 100,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'high'
  }
];

// Format date for display
function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Status badge component
function StatusBadge({ status }: { status: EmployeeJob['status'] }) {
  const config = {
    pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' },
    in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
    completed: { label: 'Completed', className: 'bg-green-500/20 text-green-700 border-green-500/30' }
  };
  
  const { label, className } = config[status];
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

// Priority indicator
function PriorityIndicator({ priority }: { priority: EmployeeJob['priority'] }) {
  if (priority === 'normal') return null;
  
  const config = {
    high: { label: 'High', className: 'bg-orange-500 text-white' },
    urgent: { label: 'Urgent', className: 'bg-red-500 text-white' }
  };
  
  const { label, className } = config[priority];
  return <Badge className={className}>{label}</Badge>;
}

// Job card component
function JobCard({ job, onMarkComplete, onReportIssue }: { 
  job: EmployeeJob; 
  onMarkComplete: (id: string) => void;
  onReportIssue: (id: string) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{job.jobNumber}</span>
              <StatusBadge status={job.status} />
              <PriorityIndicator priority={job.priority} />
            </div>
            {job.machine && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Printer className="h-4 w-4" />
                {job.machine}
              </div>
            )}
          </div>
          
          {/* Job details */}
          <div>
            <p className="text-sm text-muted-foreground">Customer: {job.customerFirstName}</p>
            <p className="font-medium mt-1">{job.itemDescription}</p>
          </div>
          
          {/* Quantity and due date */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">Qty: {job.quantity}</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Due: {formatDueDate(job.dueDate)}
            </div>
          </div>
          
          {/* Action buttons - touch friendly */}
          <div className="flex gap-2 mt-2">
            {job.status !== 'completed' && (
              <Button 
                size="lg" 
                className="flex-1 h-12"
                onClick={() => onMarkComplete(job.id)}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Mark Complete
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12"
              onClick={() => onReportIssue(job.id)}
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Report Issue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeeDashboard() {
  const { employee } = useAuth();
  const [jobs, setJobs] = useState<EmployeeJob[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    assignedJobs: 0,
    completedToday: 0,
    inProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employee jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/employees/${employee?.id}/jobs`);
        // const data = await response.json();
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setJobs(mockEmployeeJobs);
        
        // Calculate stats
        const assigned = mockEmployeeJobs.filter(j => j.status !== 'completed').length;
        const completed = mockEmployeeJobs.filter(j => j.status === 'completed').length;
        const inProgress = mockEmployeeJobs.filter(j => j.status === 'in_progress').length;
        const currentJob = mockEmployeeJobs.find(j => j.status === 'in_progress');
        
        setStats({
          assignedJobs: assigned,
          completedToday: completed,
          inProgress: inProgress,
          currentMachine: currentJob?.machine
        });
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [employee?.documentId]);

  const handleMarkComplete = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'completed' as const } : job
    ));
    // TODO: API call to update job status
  };

  const handleReportIssue = (jobId: string) => {
    // TODO: Open issue reporting modal
    console.log('Report issue for job:', jobId);
  };

  const handleScanQR = () => {
    // TODO: Integrate with QR scanner
    console.log('Open QR scanner');
  };

  // Filter active jobs (not completed)
  const activeJobs = jobs.filter(j => j.status !== 'completed');

  return (
    <div className="p-4 lg:p-6 lg:pt-6 pt-20 pb-24 lg:pb-6">
      {/* Welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {employee?.firstName || 'Employee'}
        </h1>
        <p className="text-muted-foreground">
          Here are your assigned jobs for today
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              Assigned Jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.assignedJobs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Completed Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.completedToday}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              In Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              Current Machine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{stats.currentMachine || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full lg:w-auto h-14 gap-2"
          onClick={handleScanQR}
        >
          <QrCode className="h-6 w-6" />
          Scan Job QR Code
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Jobs list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Jobs</h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading jobs...
          </div>
        ) : activeJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">
                You have no pending jobs assigned to you.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onMarkComplete={handleMarkComplete}
              onReportIssue={handleReportIssue}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
