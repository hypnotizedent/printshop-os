import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  Clock,
  Package,
  Truck,
  House,
  XCircle
} from "@phosphor-icons/react"
import type { OrderStatus } from "@/lib/types"

interface StatusStep {
  key: OrderStatus
  label: string
  icon: React.ElementType
}

// Define the order workflow steps
const WORKFLOW_STEPS: StatusStep[] = [
  { key: 'quote', label: 'Quote', icon: Clock },
  { key: 'pending', label: 'Approved', icon: CheckCircle },
  { key: 'in_production', label: 'In Production', icon: Package },
  { key: 'ready_to_ship', label: 'Ready to Ship', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: House },
]

// Status to step index mapping (for determining progress)
const STATUS_STEP_MAP: Record<OrderStatus, number> = {
  'quote': 0,
  'pending': 1,
  'in_production': 2,
  'ready_to_ship': 3,
  'shipped': 4,
  'delivered': 5,
  'completed': 5, // Same as delivered
  'invoice_paid': 5, // Same as delivered
  'payment_due': 2, // Still in production workflow
  'cancelled': -1, // Special case
}

interface StatusTimelineProps {
  status: OrderStatus
  className?: string
  showLabels?: boolean
  compact?: boolean
}

export function StatusTimeline({ 
  status, 
  className, 
  showLabels = true,
  compact = false 
}: StatusTimelineProps) {
  const currentStepIndex = STATUS_STEP_MAP[status] ?? 0
  const isCancelled = status === 'cancelled'
  const isComplete = status === 'completed' || status === 'delivered' || status === 'invoice_paid'

  const getLineColor = (stepIndex: number) => {
    if (isCancelled) {
      return 'bg-red-500/30'
    }
    if (stepIndex < currentStepIndex) {
      return 'bg-green-500'
    }
    return 'bg-muted-foreground/20'
  }

  if (isCancelled) {
    return (
      <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
        <XCircle size={24} className="text-red-500" weight="fill" />
        <span className="text-red-500 font-medium">Order Cancelled</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex || isComplete
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isCompleted ? "bg-green-500" : 
                  isActive ? "bg-blue-500" : 
                  "bg-muted-foreground/30"
                )}
              />
              {index < WORKFLOW_STEPS.length - 1 && (
                <div 
                  className={cn(
                    "w-4 h-0.5 transition-colors",
                    getLineColor(index)
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted-foreground/20 -z-10" />
        
        {/* Progress line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-green-500 -z-10 transition-all duration-500"
          style={{ 
            width: `${isComplete ? 100 : (currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` 
          }}
        />

        {WORKFLOW_STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex || (isComplete && index <= currentStepIndex)
          
          return (
            <div 
              key={step.key} 
              className="flex flex-col items-center gap-2 relative bg-background px-2"
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors border-2",
                  isCompleted 
                    ? "bg-green-500 border-green-500 text-white" 
                    : isActive 
                      ? "bg-blue-500 border-blue-500 text-white" 
                      : "bg-background border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isCompleted && !isActive ? (
                  <CheckCircle size={18} weight="fill" />
                ) : (
                  <StepIcon size={18} />
                )}
              </div>
              {showLabels && (
                <span 
                  className={cn(
                    "text-xs font-medium text-center whitespace-nowrap",
                    isCompleted || isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile view - vertical timeline */}
      <div className="md:hidden space-y-0">
        {WORKFLOW_STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex || (isComplete && index <= currentStepIndex)
          const isLast = index === WORKFLOW_STEPS.length - 1
          
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors border-2",
                    isCompleted 
                      ? "bg-green-500 border-green-500 text-white" 
                      : isActive 
                        ? "bg-blue-500 border-blue-500 text-white" 
                        : "bg-background border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle size={18} weight="fill" />
                  ) : (
                    <StepIcon size={18} />
                  )}
                </div>
                {!isLast && (
                  <div 
                    className={cn(
                      "w-0.5 h-6 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
              {showLabels && (
                <div className="pt-1">
                  <span 
                    className={cn(
                      "text-sm font-medium",
                      isCompleted || isActive 
                        ? "text-foreground" 
                        : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-blue-500 block">Current</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
