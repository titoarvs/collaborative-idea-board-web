export interface Team {
  id: number
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
