import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderSearch } from "./OrderSearch"
import { OrderFilters, type OrderFilterState } from "./OrderFilters"
import { OrderDetails } from "./OrderDetails"
import { 
  CaretLeft, 
  CaretRight, 
  Eye,
  Package
} from "@phosphor-icons/react"
import type { Order, OrderStatus, OrderListResponse } from "@/lib/types"
import { format } from "date-fns"

interface OrderHistoryProps {
  customerId?: string
}

const statusColors: Record<OrderStatus, string> = {
  quote: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  in_production: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  ready_to_ship: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-300",
  completed: "bg-green-500/10 text-green-700 dark:text-green-300",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
  invoice_paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  payment_due: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
}

const formatStatus = (status: OrderStatus): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export function OrderHistory({ customerId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<OrderFilterState>({})
  const [sortBy, setSortBy] = useState("timeline.createdAt:desc")

  // API base URL (in production, this would come from environment variables)
  const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3002'

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortBy,
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (filters.status) {
        params.append('status', filters.status)
      }

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0])
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString().split('T')[0])
      }

      const response = await fetch(`${API_BASE_URL}/api/customer/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data: OrderListResponse = await response.json()
      setOrders(data.data)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, limit, searchQuery, filters, sortBy])

  const handleViewDetails = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/orders/${orderId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      setSelectedOrder(data.data)
      setDetailsOpen(true)
    } catch (err) {
      console.error('Error fetching order details:', err)
      alert('Failed to load order details')
    }
  }

  const handleDownloadInvoice = (orderId: number) => {
    window.open(`${API_BASE_URL}/api/customer/orders/${orderId}/invoice`, '_blank')
  }

  const handleDownloadFiles = (orderId: number) => {
    window.open(`${API_BASE_URL}/api/customer/orders/${orderId}/files`, '_blank')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to first page on search
  }

  const handleFilterChange = (newFilters: OrderFilterState) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery("")
    setPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Order History</h1>
          <p className="text-muted-foreground mt-1">View and manage your past orders</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <OrderSearch onSearch={handleSearch} />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline.createdAt:desc">Newest First</SelectItem>
              <SelectItem value="timeline.createdAt:asc">Oldest First</SelectItem>
              <SelectItem value="totals.total:desc">Highest Amount</SelectItem>
              <SelectItem value="totals.total:asc">Lowest Amount</SelectItem>
              <SelectItem value="printavoId:desc">Order # (High-Low)</SelectItem>
              <SelectItem value="printavoId:asc">Order # (Low-High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <OrderFilters 
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          <Button onClick={fetchOrders} className="mt-4">Try Again</Button>
        </Card>
      )}

      {/* Desktop Table View */}
      {!loading && !error && orders.length > 0 && (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.attributes.printavoId}
                      {order.attributes.orderNickname && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          {order.attributes.orderNickname}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.attributes.timeline.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.attributes.status]}>
                        {formatStatus(order.attributes.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-muted-foreground" />
                        <span>{order.attributes.lineItems.length} item(s)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${order.attributes.totals.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order.id)}
                      >
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">#{order.attributes.printavoId}</p>
                      {order.attributes.orderNickname && (
                        <p className="text-sm text-muted-foreground">
                          {order.attributes.orderNickname}
                        </p>
                      )}
                    </div>
                    <Badge className={statusColors[order.attributes.status]}>
                      {formatStatus(order.attributes.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(order.attributes.timeline.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">{order.attributes.lineItems.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-lg font-bold">
                      ${order.attributes.totals.total.toFixed(2)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      <Eye size={16} className="mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <CaretLeft size={16} />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(pages)].map((_, i) => {
                    const pageNum = i + 1
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === pages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="px-2">...</span>
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                >
                  Next
                  <CaretRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <Card className="p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filters.status || filters.dateFrom || filters.dateTo
              ? "Try adjusting your search or filters"
              : "You don't have any orders yet"}
          </p>
          {(searchQuery || filters.status || filters.dateFrom || filters.dateTo) && (
            <Button onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onDownloadInvoice={handleDownloadInvoice}
              onDownloadFiles={handleDownloadFiles}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
