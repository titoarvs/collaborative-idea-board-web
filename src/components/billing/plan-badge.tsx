import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/billing/entitlements'
import type { Plan } from '@/lib/types'

export function PlanBadge({
  plan,
  className,
}: {
  plan: Plan
  className?: string
}) {
  const isPro = plan === 'pro'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        isPro
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {isPro && <Sparkles className="h-3 w-3" />}
      {PLAN_LIMITS[plan].label}
    </span>
  )
}
