import type { Organization, Plan } from '@/lib/types'

export interface PlanLimit {
  label: string
  boards: number
  retro: boolean
  priceLabel: string
  features: string[]
}

/**
 * Client-side mirror of the plan limits. The backend is the source of truth and
 * enforces these; this drives UI affordances and pre-emptive gating only.
 */
export const PLAN_LIMITS: Record<Plan, PlanLimit> = {
  free: {
    label: 'Free',
    boards: 1,
    retro: false,
    priceLabel: 'Free',
    features: ['1 board', '30-day trial', 'Kanban board', 'Team invites'],
  },
  pro: {
    label: 'Pro',
    boards: 10,
    retro: true,
    priceLabel: '$12 / mo',
    features: [
      'Up to 10 boards',
      'Retro whiteboard',
      'Unlimited collaborators',
      'Priority support',
    ],
  },
}

export const TRIAL_DAYS = 30

export interface Entitlements {
  plan: Plan
  boardLimit: number
  boardCount: number
  canCreateBoard: boolean
  retroEnabled: boolean
  /** Whole days remaining in the trial, or null if not on a trial. */
  trialDaysLeft: number | null
  isTrialing: boolean
  isTrialExpired: boolean
  /** Free org whose trial has lapsed: writes are blocked until upgrade. */
  isLocked: boolean
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const end = new Date(iso).getTime()
  if (Number.isNaN(end)) return null
  return Math.ceil((end - Date.now()) / MS_PER_DAY)
}

/** Derive what an organization is allowed to do under its current plan. */
export function getEntitlements(org: Organization | null | undefined): Entitlements {
  const plan: Plan = org?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan]
  const boardCount = org?.boardCount ?? 0
  const isTrialing = org?.status === 'trialing'
  const trialDaysLeft = isTrialing ? daysUntil(org?.trialEndsAt ?? null) : null
  const isTrialExpired =
    plan === 'free' &&
    (org?.status === 'expired' ||
      (isTrialing && trialDaysLeft !== null && trialDaysLeft <= 0))
  const isLocked = isTrialExpired

  return {
    plan,
    boardLimit: limit.boards,
    boardCount,
    canCreateBoard: !isLocked && boardCount < limit.boards,
    retroEnabled: limit.retro && !isLocked,
    trialDaysLeft,
    isTrialing,
    isTrialExpired,
    isLocked,
  }
}

/** Hook form for use inside components. */
export function useEntitlements(org: Organization | null | undefined): Entitlements {
  return getEntitlements(org)
}
