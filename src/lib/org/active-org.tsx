import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Organization } from '@/lib/types'
import { useOrganizations } from './use-organizations'

const STORAGE_KEY = 'ideaboard.activeOrgId'

interface ActiveOrgContextValue {
  organizations: Organization[]
  activeOrg: Organization | null
  activeOrgId: number | null
  setActiveOrgId: (id: number) => void
  getOrgById: (id: number | null | undefined) => Organization | null
  isLoading: boolean
}

const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null)

function readStored(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { data: organizations = [], isLoading } = useOrganizations()
  const [activeOrgId, setActiveOrgIdState] = useState<number | null>(readStored)

  // Reconcile the stored id with the orgs the user can actually access.
  useEffect(() => {
    if (organizations.length === 0) return
    const exists = organizations.some((o) => o.id === activeOrgId)
    if (!exists) {
      setActiveOrgIdState(organizations[0].id)
    }
  }, [organizations, activeOrgId])

  const setActiveOrgId = (id: number) => {
    setActiveOrgIdState(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(id))
    }
  }

  const value = useMemo<ActiveOrgContextValue>(() => {
    const getOrgById = (id: number | null | undefined) =>
      organizations.find((o) => o.id === id) ?? null
    return {
      organizations,
      activeOrg: getOrgById(activeOrgId),
      activeOrgId,
      setActiveOrgId,
      getOrgById,
      isLoading,
    }
  }, [organizations, activeOrgId, isLoading])

  return (
    <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>
  )
}

export function useActiveOrg(): ActiveOrgContextValue {
  const ctx = useContext(ActiveOrgContext)
  if (!ctx) {
    throw new Error('useActiveOrg must be used within an ActiveOrgProvider')
  }
  return ctx
}
