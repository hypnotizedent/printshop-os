import type { OrderStatus } from "@/lib/types"

// Status colors following issue requirements (quote=blue, production=yellow, complete=green)
export const orderStatusColors: Record<OrderStatus, string> = {
  quote: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  in_production: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  ready_to_ship: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  completed: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  invoice_paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  payment_due: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
}

export const formatOrderStatus = (status: OrderStatus): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}
