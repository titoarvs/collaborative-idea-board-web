import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Comment } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Send } from 'lucide-react'

function initials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function DiscussionThread({ ideaId }: { ideaId: number }) {
  const { user } = useAuth()
  const currentUserId = user?.id
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const qc = useQueryClient()

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', ideaId],
    queryFn: () => api.get<Comment[]>(`/ideas/${ideaId}/comments`),
    refetchInterval: 3000,
  })

  const reload = () => qc.invalidateQueries({ queryKey: ['comments', ideaId] })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    setContent('')
    try {
      await api.post(`/ideas/${ideaId}/comments`, { content: text })
      await reload()
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
      )
    } catch (error) {
      console.error('Error adding comment:', error)
      setContent(text)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/comments/${id}`)
      await reload()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No comments yet. Start the discussion.
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {initials(comment.authorName || 'User')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {comment.authorName || 'User'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </span>
                {comment.userId === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 border-t border-border pt-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="h-20 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              void handleSubmit(e)
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {'\u2318'}/Ctrl + Enter to send
          </span>
          <Button type="submit" size="sm" disabled={sending || !content.trim()}>
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}
