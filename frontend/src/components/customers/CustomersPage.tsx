import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Buildings, Package, CurrencyDollar, Users } from "@phosphor-icons/react"
import { CustomerList } from "./CustomerList"
import { CustomerDetail } from "./CustomerDetail"
import { type CustomerCardData } from "./CustomerCard"
import { toast } from "sonner"

interface CustomersPageProps {
  customers?: { totalOrders: number; totalRevenue: number; status: string }[]
}

export function CustomersPage({ customers = [] }: CustomersPageProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Calculate stats from passed customers (for header cards)
  const totalRevenue = customers.reduce((acc, c) => acc + c.totalRevenue, 0)
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalOrders = customers.reduce((acc, c) => acc + c.totalOrders, 0)
  const totalCustomers = customers.length

  const handleSelectCustomer = (customer: CustomerCardData) => {
    setSelectedCustomerId(customer.documentId)
  }

  const handleBackToList = () => {
    setSelectedCustomerId(null)
  }

  const handleNewOrder = (customerId?: string) => {
    // TODO: Navigate to quote/order creation with customer pre-filled
    toast.info('New order functionality coming soon')
    console.log('Create new order for customer:', customerId || selectedCustomerId)
  }

  // If a customer is selected, show the detail view
  if (selectedCustomerId) {
    return (
      <CustomerDetail
        customerId={selectedCustomerId}
        onBack={handleBackToList}
        onNewOrder={() => handleNewOrder(selectedCustomerId)}
      />
    )
  }

  // Otherwise show the list view
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships and orders</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} weight="bold" />
          Add Customer
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Customers</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">{totalCustomers.toLocaleString()}</p>
            </div>
            <div className="p-2 md:p-3 rounded-lg bg-primary/10">
              <Users size={20} className="text-primary md:hidden" />
              <Users size={24} className="text-primary hidden md:block" weight="fill" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Active</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">{activeCustomers.toLocaleString()}</p>
            </div>
            <div className="p-2 md:p-3 rounded-lg bg-cyan/10">
              <Buildings size={20} className="text-cyan md:hidden" />
              <Buildings size={24} weight="fill" className="text-cyan hidden md:block" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Orders</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="p-2 md:p-3 rounded-lg bg-blue-500/10">
              <Package size={20} className="text-blue-500 md:hidden" />
              <Package size={24} weight="fill" className="text-blue-500 hidden md:block" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">Revenue</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">
                ${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(0)}k` : totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-2 md:p-3 rounded-lg bg-green-500/10">
              <CurrencyDollar size={20} className="text-green-600 md:hidden" />
              <CurrencyDollar size={24} weight="fill" className="text-green-600 hidden md:block" />
            </div>
          </div>
        </Card>
      </div>

      {/* Customer list with search, filters, and pagination */}
      <CustomerList
        onSelectCustomer={handleSelectCustomer}
        onNewOrder={handleNewOrder}
      />
    </div>
  )
}
