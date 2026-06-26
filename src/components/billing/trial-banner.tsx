import { Link } from '@tanstack/react-router'
import { AlertTriangle, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useActiveOrg } from '@/lib/org/active-org'
import { useEntitlements } from '@/lib/billing/entitlements'

/**
 * Slim banner shown above app content while an org is on its trial, or a locked
 * state once the trial has expired on the Free plan.
 */
export function TrialBanner() {
  const { activeOrg } = useActiveOrg()
  const ent = useEntitlements(activeOrg)

  if (!activeOrg) return null

  if (ent.isTrialExpired) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-6 py-2.5 text-sm md:px-8">
        <span className="flex items-center gap-2 font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Your free trial has ended. Upgrade to keep creating and editing boards.
        </span>
        <Link to="/billing">
          <Button size="sm">
            <Sparkles className="h-4 w-4" />
            Upgrade
          </Button>
        </Link>
      </div>
    )
  }

  if (ent.isTrialing && ent.trialDaysLeft !== null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-6 py-2.5 text-sm md:px-8">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {ent.trialDaysLeft <= 0
            ? 'Trial ends today'
            : `${ent.trialDaysLeft} day${ent.trialDaysLeft === 1 ? '' : 's'} left in your Pro trial`}
        </span>
        <Link to="/billing">
          <Button size="sm" variant="outline">
            View plans
          </Button>
        </Link>
      </div>
    )
  }

  return null
}
