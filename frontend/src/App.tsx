import { useState } from "react"
import { useKV } from "@github/spark/hooks"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "./components/layout/AppSidebar"
import { DashboardPage } from "./components/dashboard/DashboardPage"
import { JobsPage } from "./components/jobs/JobsPage"
import { MachinesPage } from "./components/machines/MachinesPage"
import { CustomersPage } from "./components/customers/CustomersPage"
import { FilesPage } from "./components/files/FilesPage"
import { ReportsPage } from "./components/reports/ReportsPage"
import { SettingsPage } from "./components/settings/SettingsPage"
import { ProductionPage } from "./components/production/ProductionPage"
import LabelsDemo from "./pages/LabelsDemo"
import type { Job, Customer, Machine, FileItem, DashboardStats } from "./lib/types"

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [jobs] = useKV<Job[]>("jobs", [])
  const [customers] = useKV<Customer[]>("customers", [])
  const [machines] = useKV<Machine[]>("machines", [])
  const [files] = useKV<FileItem[]>("files", [])

  const jobsList = jobs || []
  const customersList = customers || []
  const machinesList = machines || []
  const filesList = files || []

  const stats: DashboardStats = {
    activeJobs: jobsList.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length,
    completedToday: jobsList.filter(j => j.status === 'completed').length,
    revenue: jobsList.reduce((acc, j) => acc + j.estimatedCost, 0),
    machinesOnline: machinesList.filter(m => m.status !== 'offline').length,
    lowStockItems: 3,
    urgentJobs: jobsList.filter(j => j.priority === 'urgent').length
  }

  const recentJobs = jobsList.slice(0, 5)

  const handleUpdateJob = (jobId: string, updates: Partial<Job>) => {
    console.log("Update job:", jobId, updates)
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage stats={stats} recentJobs={recentJobs} machines={machinesList} onNavigate={setCurrentPage} />
      case "production":
        return <ProductionPage />
      case "jobs":
        return <JobsPage jobs={jobsList} onUpdateJob={handleUpdateJob} />
      case "machines":
        return <MachinesPage machines={machinesList} />
      case "customers":
        return <CustomersPage customers={customersList} />
      case "files":
        return <FilesPage files={filesList} />
      case "reports":
        return <ReportsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage stats={stats} recentJobs={recentJobs} machines={machinesList} onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-[1600px] mx-auto">
          {renderPage()}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default App