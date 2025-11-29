import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "./components/layout/AppSidebar"
import { DashboardPage } from "./components/dashboard/DashboardPage"
import { JobsPage } from "./components/jobs/JobsPage"
import { ProductionScheduleView } from "./components/machines/ProductionScheduleView"
import { CustomersPage } from "./components/customers/CustomersPage"
import { CustomerDetailPage } from "./components/customers/CustomerDetailPage"
import { FilesPage } from "./components/files/FilesPage"
import { ReportsPage } from "./components/reports/ReportsPage"
import { SettingsPage } from "./components/settings/SettingsPage"
import { ProductionPage } from "./components/production/ProductionPage"
import LabelsDemo from "./pages/LabelsDemo"
import { QuoteForm } from "./components/quotes/QuoteForm"
import { ProductCatalog } from "./components/products/ProductCatalog"
import { ShippingLabelForm } from "./components/shipping/ShippingLabelForm"
import type { Job, Customer, Machine, FileItem, DashboardStats } from "./lib/types"
import { toast } from "sonner"

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [machines] = useState<Machine[]>([])
  const [files] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch customers from Strapi
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers
        const customersRes = await fetch(`${API_BASE}/api/customers?pagination[limit]=500`);
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          const transformedCustomers: Customer[] = (customersData.data || []).map((c: any) => ({
            id: c.documentId || c.id.toString(),
            name: c.name || 'Unknown',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            totalOrders: 0, // Will be calculated from orders
            totalRevenue: 0,
            lastOrderDate: c.updatedAt || new Date().toISOString(),
            status: 'active' as const,
          }));
          setCustomers(transformedCustomers);
        }

        // Fetch orders and transform to jobs for the Kanban board
        const ordersRes = await fetch(`${API_BASE}/api/orders?populate=customer&pagination[limit]=100`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const transformedJobs: Job[] = (ordersData.data || []).map((o: any) => {
            // Map Strapi order status to Job status
            const statusMap: Record<string, Job['status']> = {
              'QUOTE': 'quote',
              'QUOTE_SENT': 'quote',
              'Quote Out For Approval - Email': 'quote',
              'PENDING': 'design',
              'IN_PRODUCTION': 'printing',
              'READY_TO_SHIP': 'finishing',
              'SHIPPED': 'delivery',
              'DELIVERED': 'completed',
              'COMPLETED': 'completed',
              'INVOICE PAID': 'completed',
              'CANCELLED': 'cancelled',
            };
            
            return {
              id: o.documentId || o.id.toString(),
              title: `Order #${o.orderNumber}`,
              customer: o.customer?.name || 'Unknown Customer',
              customerId: o.customer?.documentId || '',
              status: statusMap[o.status] || 'quote',
              priority: 'normal' as const,
              dueDate: o.dueDate || new Date().toISOString(),
              createdAt: o.createdAt,
              description: o.notes || '',
              quantity: o.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
              fileCount: 0,
              estimatedCost: o.totalAmount || 0,
              progress: o.status === 'COMPLETED' || o.status === 'INVOICE PAID' ? 100 : 50,
            };
          });
          setJobs(transformedJobs);

          // Update customer order counts
          const customerOrderCounts: Record<string, { count: number; revenue: number }> = {};
          (ordersData.data || []).forEach((o: any) => {
            const custId = o.customer?.documentId;
            if (custId) {
              if (!customerOrderCounts[custId]) {
                customerOrderCounts[custId] = { count: 0, revenue: 0 };
              }
              customerOrderCounts[custId].count++;
              customerOrderCounts[custId].revenue += o.totalAmount || 0;
            }
          });

          setCustomers(prev => prev.map(c => ({
            ...c,
            totalOrders: customerOrderCounts[c.id]?.count || 0,
            totalRevenue: customerOrderCounts[c.id]?.revenue || 0,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const jobsList = jobs
  const customersList = customers
  const machinesList = machines
  const filesList = files

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

  // Handler for viewing customer details
  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage("customer-detail");
  }

  // Handler for creating new order for a customer
  const handleNewOrder = (customerId: string) => {
    // Navigate to quotes page with customer pre-selected
    setSelectedCustomerId(customerId);
    setCurrentPage("quotes");
    toast.success("Creating new quote", {
      description: "Customer info has been pre-filled"
    });
  }

  // Get the selected customer for quotes
  const selectedCustomer = customersList.find(c => c.id === selectedCustomerId);

  // Handler for going back from customer detail
  const handleBackFromCustomer = () => {
    setSelectedCustomerId(null);
    setCurrentPage("customers");
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
        return <ProductionScheduleView />
      case "customers":
        return (
          <CustomersPage 
            customers={customersList} 
            onViewCustomer={handleViewCustomer}
            onNewOrder={handleNewOrder}
          />
        )
      case "customer-detail":
        return selectedCustomerId ? (
          <CustomerDetailPage
            customerId={selectedCustomerId}
            onBack={handleBackFromCustomer}
            onNewOrder={handleNewOrder}
          />
        ) : (
          <CustomersPage 
            customers={customersList}
            onViewCustomer={handleViewCustomer}
            onNewOrder={handleNewOrder}
          />
        )
      case "files":
        return <FilesPage files={filesList} />
      case "reports":
        return <ReportsPage />
      case "settings":
        return <SettingsPage />
      case "labels-demo":
        return <LabelsDemo />
      case "quotes":
        return <QuoteForm initialCustomer={selectedCustomer ? {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          company: selectedCustomer.company,
        } : undefined} />
      case "products":
        return <ProductCatalog />
      case "shipping":
        return <ShippingLabelForm />
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