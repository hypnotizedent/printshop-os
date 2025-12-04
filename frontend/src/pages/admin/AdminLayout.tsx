/**
 * Admin Layout
 * Full admin dashboard for owners
 * Wraps existing MainDashboard functionality under /admin/* routes
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { JobsPage } from '@/components/jobs/JobsPage';
import { ProductionScheduleView } from '@/components/machines/ProductionScheduleView';
import { CustomersPage } from '@/components/customers/CustomersPage';
import { CustomerDetailPage } from '@/components/customers/CustomerDetailPage';
import { OrderDetailPage } from '@/components/orders/OrderDetailPage';
import { FilesPage } from '@/components/files/FilesPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ProductionPage } from '@/components/production/ProductionPage';
import LabelsDemo from '@/pages/LabelsDemo';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { ProductsPage } from '@/components/products/ProductsPage';
import { ShippingLabelForm } from '@/components/shipping/ShippingLabelForm';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { ShipmentTracking } from '@/components/shipping/ShipmentTracking';
import { InvoicesPage } from '@/components/invoices/InvoicesPage';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';
import { PageLoading } from '@/components/ui/states';
import type { Job, Customer, Machine, FileItem, DashboardStats } from '@/lib/types';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export function AdminLayout() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [machines] = useState<Machine[]>([]);
  const [files] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customers from Strapi
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers first
        let customersRawData: { printavoId?: string; name?: string; documentId?: string; id: number; email?: string; phone?: string; company?: string; updatedAt?: string }[] = [];
        const customersRes = await fetch(`${API_BASE}/api/customers?pagination[limit]=5000`);
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          customersRawData = customersData.data || [];
          const transformedCustomers: Customer[] = customersRawData.map((c) => ({
            id: c.documentId || c.id.toString(),
            name: c.name || 'Unknown',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            totalOrders: 0,
            totalRevenue: 0,
            lastOrderDate: c.updatedAt || new Date().toISOString(),
            status: 'active' as const,
          }));
          setCustomers(transformedCustomers);
        }
        
        // Build customer lookup
        const customersLookup: Record<string, string> = {};
        customersRawData.forEach((c) => {
          if (c.printavoId) {
            customersLookup[c.printavoId] = c.name || 'Unknown';
          }
        });

        // Fetch orders
        const ordersRes = await fetch(`${API_BASE}/api/orders?populate=customer&pagination[limit]=5000&filters[$or][0][status][$ne]=INVOICE_PAID&filters[$or][1][status][$ne]=COMPLETE`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          
          const transformedJobs: Job[] = (ordersData.data || []).map((o: { 
            documentId?: string; 
            id: number; 
            orderNickname?: string; 
            orderNumber?: string;
            customer?: { name?: string; documentId?: string };
            printavoCustomerId?: string;
            status?: string;
            dueDate?: string;
            createdAt?: string;
            notes?: string;
            items?: { quantity?: number }[];
            totalAmount?: number;
          }) => {
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
            
            const customerName = o.customer?.name || 
              (o.printavoCustomerId ? customersLookup[o.printavoCustomerId] : null) || 
              'Unknown Customer';
            
            return {
              id: o.documentId || o.id.toString(),
              title: o.orderNickname || `Order #${o.orderNumber}`,
              customer: customerName,
              customerId: o.customer?.documentId || '',
              status: statusMap[o.status || ''] || 'quote',
              priority: 'normal' as const,
              dueDate: o.dueDate || new Date().toISOString(),
              createdAt: o.createdAt || new Date().toISOString(),
              description: o.notes || '',
              quantity: o.items?.reduce((sum: number, item) => sum + (item.quantity || 0), 0) || 0,
              fileCount: 0,
              estimatedCost: o.totalAmount || 0,
              progress: o.status === 'COMPLETED' || o.status === 'INVOICE PAID' ? 100 : 50,
            };
          });
          setJobs(transformedJobs);

          // Update customer order counts
          const customerOrderCounts: Record<string, { count: number; revenue: number }> = {};
          (ordersData.data || []).forEach((o: { customer?: { documentId?: string }; totalAmount?: number }) => {
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

  const activeJobsList = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');

  const stats: DashboardStats = {
    activeJobs: activeJobsList.length,
    completedToday: jobs.filter(j => j.status === 'completed').length,
    revenue: jobs.reduce((acc, j) => acc + j.estimatedCost, 0),
    machinesOnline: machines.filter(m => m.status !== 'offline').length,
    lowStockItems: 3,
    urgentJobs: jobs.filter(j => j.priority === 'urgent').length
  };

  const recentJobs = jobs.slice(0, 5);

  const handleUpdateJob = (jobId: string, updates: Partial<Job>) => {
    console.log("Update job:", jobId, updates);
  };

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage("customer-detail");
  };

  const handleNewOrder = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage("quotes");
    toast.success("Creating new quote", {
      description: "Customer info has been pre-filled"
    });
  };

  const handleBackFromCustomer = () => {
    setSelectedCustomerId(null);
    setCurrentPage("customers");
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage("order-detail");
  };

  const handleBackFromOrder = () => {
    setSelectedOrderId(null);
    if (selectedCustomerId) {
      setCurrentPage("customer-detail");
    } else {
      setCurrentPage("jobs");
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage stats={stats} recentJobs={recentJobs} machines={machines} onNavigate={setCurrentPage} onViewOrder={handleViewOrder} />;
      case "production":
        return <ProductionPage />;
      case "jobs":
        return <JobsPage jobs={activeJobsList} onUpdateJob={handleUpdateJob} onViewOrder={handleViewOrder} />;
      case "machines":
        return <ProductionScheduleView />;
      case "customers":
        return (
          <CustomersPage 
            customers={customers} 
            onViewCustomer={handleViewCustomer}
            onNewOrder={handleNewOrder}
          />
        );
      case "customer-detail":
        return selectedCustomerId ? (
          <CustomerDetailPage
            customerId={selectedCustomerId}
            onBack={handleBackFromCustomer}
            onNewOrder={handleNewOrder}
            onViewOrder={handleViewOrder}
          />
        ) : (
          <CustomersPage 
            customers={customers}
            onViewCustomer={handleViewCustomer}
            onNewOrder={handleNewOrder}
          />
        );
      case "order-detail":
        return selectedOrderId ? (
          <OrderDetailPage
            orderId={selectedOrderId}
            onBack={handleBackFromOrder}
          />
        ) : (
          <JobsPage jobs={jobs} onUpdateJob={handleUpdateJob} onViewOrder={handleViewOrder} />
        );
      case "files":
        return <FilesPage files={files} />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      case "labels-demo":
        return <LabelsDemo />;
      case "quotes":
        return <QuoteBuilder />;
      case "products":
        return <ProductsPage />;
      case "shipping":
        return <ShippingLabelForm />;
      case "tracking":
        return <ShipmentTracking />;
      case "invoices":
        return <InvoicesPage onViewOrder={handleViewOrder} />;
      case "ai-assistant":
        return <AIAssistantPage />;
      default:
        return <DashboardPage stats={stats} recentJobs={recentJobs} machines={machines} onNavigate={setCurrentPage} onViewOrder={handleViewOrder} />;
    }
  };

  return (
    <ProtectedRoute allowedUserTypes={['owner']}>
      <div className="flex min-h-screen bg-background">
        <SkipNavLink />
        <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <SkipNavContent>
          <main className="flex-1 p-8 overflow-auto" role="main" aria-label="Main content">
            <div className="w-full">
              {isLoading ? (
                <PageLoading message="Loading your dashboard..." />
              ) : (
                renderPage()
              )}
            </div>
          </main>
        </SkipNavContent>
      </div>
    </ProtectedRoute>
  );
}

export default AdminLayout;
