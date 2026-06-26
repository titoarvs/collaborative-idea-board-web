import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Sparkles, Clock, ExternalLink } from 'lucide-react'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useActiveOrg } from '@/lib/org/active-org'
import { useOrgTeams } from '@/lib/org/use-organizations'
import { useSubscription, useCheckout, useBillingPortal } from '@/lib/billing/use-billing'
import { PLAN_LIMITS, useEntitlements } from '@/lib/billing/entitlements'
import type { Plan } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { PlanBadge } from '@/components/billing/plan-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/billing')({
  component: BillingPage,
})

function BillingPage() {
  const { user } = useRequireAuth()
  const { activeOrg, activeOrgId } = useActiveOrg()
  const teamsQuery = useOrgTeams(activeOrgId)
  const subscriptionQuery = useSubscription(activeOrgId)
  const ent = useEntitlements(activeOrg)
  const checkout = useCheckout()
  const portal = useBillingPortal()
  const qc = useQueryClient()

  // Refresh plan state when returning from the provider's hosted checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('status')) {
      void qc.invalidateQueries({ queryKey: ['organizations'] })
      void qc.invalidateQueries({
        queryKey: ['organization', activeOrgId, 'subscription'],
      })
    }
  }, [qc, activeOrgId])

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const teams = teamsQuery.data ?? []
  const currentPlan = activeOrg?.plan ?? 'free'
  const sub = subscriptionQuery.data

  const handleUpgrade = (plan: Plan) => {
    if (!activeOrgId) return
    if (plan === 'pro') checkout.mutate({ organizationId: activeOrgId, plan })
  }

  return (
    <AppShell user={user} teams={teams}>
      <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing &amp; Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the subscription for{' '}
            <span className="font-medium text-foreground">
              {activeOrg?.name ?? 'your organization'}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Current plan
              </span>
              <PlanBadge plan={currentPlan} />
            </div>
            <p className="mt-1 text-sm text-foreground">
              {ent.boardCount} / {ent.boardLimit} boards used
            </p>
            {ent.isTrialing && ent.trialDaysLeft !== null && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {ent.trialDaysLeft <= 0
                  ? 'Trial ends today'
                  : `${ent.trialDaysLeft} days left in trial`}
              </p>
            )}
            {ent.isTrialExpired && (
              <p className="mt-1 text-sm font-medium text-destructive">
                Trial expired &mdash; upgrade to continue
              </p>
            )}
          </div>
          {currentPlan === 'pro' && (
            <Button
              variant="outline"
              disabled={!activeOrgId || portal.isPending}
              onClick={() =>
                activeOrgId && portal.mutate({ organizationId: activeOrgId })
              }
            >
              <ExternalLink className="h-4 w-4" />
              {portal.isPending ? 'Opening...' : 'Manage subscription'}
            </Button>
          )}
        </div>

        {sub?.cancelAtPeriodEnd && sub.currentPeriodEnd && (
          <div className="rounded-lg border border-amber-300/40 bg-amber-50/50 p-4 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
            Your subscription is set to cancel on{' '}
            {new Date(sub.currentPeriodEnd).toLocaleDateString()}.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(PLAN_LIMITS) as Plan[]).map((plan) => {
            const limit = PLAN_LIMITS[plan]
            const isCurrent = plan === currentPlan
            return (
              <div
                key={plan}
                className={cn(
                  'flex flex-col rounded-xl border bg-card p-6',
                  plan === 'pro'
                    ? 'border-primary shadow-sm'
                    : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    {limit.label}
                  </h3>
                  {plan === 'pro' && <PlanBadge plan="pro" />}
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {limit.priceLabel}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {limit.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : plan === 'pro' ? (
                    <Button
                      className="w-full"
                      disabled={checkout.isPending || !activeOrgId}
                      onClick={() => handleUpgrade('pro')}
                    >
                      <Sparkles className="h-4 w-4" />
                      {checkout.isPending ? 'Redirecting...' : 'Upgrade to Pro'}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Downgrade in portal
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {checkout.isError && (
          <p className="text-sm text-destructive">
            Could not start checkout. Please try again.
          </p>
        )}
      </div>
    </AppShell>
  )
}
