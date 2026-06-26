import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { user, isFetched } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isFetched) return
    void navigate({ to: user ? '/dashboard' : '/sign-in' })
  }, [isFetched, user, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center text-muted-foreground">
      Loading...
    </div>
  )
}
