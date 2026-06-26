import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useSignOut } from '@/lib/auth'

export function LogoutButton() {
  const navigate = useNavigate()
  const signOut = useSignOut()

  const handleLogout = async () => {
    try {
      await signOut.mutateAsync()
    } finally {
      void navigate({ to: '/sign-in' })
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={signOut.isPending}
      variant="outline"
      size="sm"
      className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-4 w-4" />
      {signOut.isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
