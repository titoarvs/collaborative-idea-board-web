import { useState } from 'react'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlanBadge } from '@/components/billing/plan-badge'
import { CreateOrgModal } from './create-org-modal'
import { useActiveOrg } from '@/lib/org/active-org'
import { cn } from '@/lib/utils'

export function OrgSwitcher() {
  const { organizations, activeOrg, setActiveOrgId } = useActiveOrg()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted',
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">
              {activeOrg?.name ?? 'No organization'}
            </span>
            {activeOrg && (
              <span className="block truncate text-xs text-muted-foreground">
                {activeOrg.plan === 'pro' ? 'Pro plan' : 'Free plan'}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setActiveOrgId(org.id)}
              className="gap-2"
            >
              <span className="flex-1 truncate">{org.name}</span>
              <PlanBadge plan={org.plan} />
              {org.id === activeOrg?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showCreate && <CreateOrgModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
