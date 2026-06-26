import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS } from '@/lib/billing/entitlements'
import type { PlanErrorCode } from '@/lib/api'

type UpgradeReason = PlanErrorCode | 'manual'

const REASON_COPY: Record<UpgradeReason, { title: string; body: string }> = {
  BOARD_LIMIT: {
    title: "You've reached your board limit",
    body: 'The Free plan includes a single board. Upgrade to Pro to create up to 10 boards.',
  },
  PLAN_REQUIRED: {
    title: 'This is a Pro feature',
    body: 'The retro whiteboard is available on the Pro plan. Upgrade to unlock it for your team.',
  },
  TRIAL_EXPIRED: {
    title: 'Your free trial has ended',
    body: 'Upgrade to Pro to keep collaborating. Your boards are safe and will be restored instantly.',
  },
  manual: {
    title: 'Upgrade to Pro',
    body: 'Unlock more boards, the retro whiteboard, and unlimited collaborators.',
  },
}

interface UpgradeModalContextValue {
  open: (reason?: UpgradeReason) => void
  close: () => void
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null)

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<UpgradeReason | null>(null)
  const navigate = useNavigate()

  const open = useCallback((next: UpgradeReason = 'manual') => setReason(next), [])
  const close = useCallback(() => setReason(null), [])

  const value = useMemo(() => ({ open, close }), [open, close])

  const copy = reason ? REASON_COPY[reason] : null

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      {copy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-foreground">{copy.title}</h2>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{copy.body}</p>

            <ul className="space-y-2 rounded-lg border border-border bg-background p-4">
              {PLAN_LIMITS.pro.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>
                Not now
              </Button>
              <Button
                onClick={() => {
                  close()
                  void navigate({ to: '/billing' })
                }}
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      )}
    </UpgradeModalContext.Provider>
  )
}

export function useUpgradeModal(): UpgradeModalContextValue {
  const ctx = useContext(UpgradeModalContext)
  if (!ctx) {
    throw new Error('useUpgradeModal must be used within an UpgradeModalProvider')
  }
  return ctx
}
