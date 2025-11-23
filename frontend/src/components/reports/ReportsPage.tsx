import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartBar, TrendUp, CurrencyDollar, Package } from "@phosphor-icons/react"

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and insights for your print shop</p>
        </div>
        <Button>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: CurrencyDollar, label: "Revenue", value: "$45,231", change: "+12%" },
          { icon: Package, label: "Jobs Completed", value: "156", change: "+8%" },
          { icon: TrendUp, label: "Avg Job Value", value: "$290", change: "+5%" },
          { icon: ChartBar, label: "Utilization", value: "78%", change: "+3%" },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 font-semibold mt-1">{stat.change}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <stat.icon size={24} weight="fill" className="text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Revenue Trends</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Chart visualization would appear here</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Job Distribution</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Chart visualization would appear here</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
