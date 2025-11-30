import { House, FolderOpen, Users, Package, Printer, ChartBar, Gear, Bell, ClockAfternoon, FileText, ShoppingCart, Truck, MapTrifold, Robot } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

interface AppSidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const navItems: NavItem[] = [
    { icon: House, label: "Dashboard", href: "dashboard" },
    { icon: ClockAfternoon, label: "Production", href: "production" },
    { icon: Package, label: "Jobs", href: "jobs", badge: 12 },
    { icon: FileText, label: "Quotes", href: "quotes" },
    { icon: ShoppingCart, label: "Products", href: "products" },
    { icon: Truck, label: "Shipping", href: "shipping" },
    { icon: MapTrifold, label: "Tracking", href: "tracking" },
    { icon: Robot, label: "AI Assistant", href: "ai-assistant" },
    { icon: FolderOpen, label: "Files", href: "files" },
    { icon: Users, label: "Customers", href: "customers" },
    { icon: Printer, label: "Schedule", href: "machines" },
    { icon: ChartBar, label: "Reports", href: "reports" },
    { icon: Gear, label: "Settings", href: "settings" },
  ]

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Printer className="text-primary-foreground" size={24} weight="bold" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">PrintShop OS</h1>
            <p className="text-xs text-muted-foreground">v2.0.1</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.href
          
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-accent text-accent-foreground"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors">
          <Bell size={20} />
          <span className="font-medium text-sm">Notifications</span>
          <span className="ml-auto w-2 h-2 bg-accent rounded-full"></span>
        </button>
      </div>
    </aside>
  )
}
