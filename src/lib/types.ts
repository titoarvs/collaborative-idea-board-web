export type Plan = 'free' | 'pro'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'

export type OrgRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: number
  name: string
  plan: Plan
  status: SubscriptionStatus
  /** ISO timestamp; null when the org is on a paid plan with no trial. */
  trialEndsAt: string | null
  /** Number of boards (teams) currently owned by the org. */
  boardCount: number
  /** The current user's role within this organization. */
  role: OrgRole
  createdAt: string
  updatedAt: string
}

export interface OrgMember {
  userId: string
  name: string | null
  email: string
  image: string | null
  role: OrgRole
}

export interface Subscription {
  plan: Plan
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface Team {
  id: number
  organizationId: number
  userId: string
  name: string
  description: string | null
  inviteCode: string
  activeSessions: number
  maxSessions: number
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface Idea {
  id: number
  teamId: number
  userId: string
  title: string
  description?: string | null
  status: string
  votes: number
  position: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  ideaId: number
  userId: string
  content: string
  createdAt: string
  authorName: string | null
}
