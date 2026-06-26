import { io, type Socket } from 'socket.io-client'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
)

let socket: Socket | null = null

/**
 * Shared socket.io connection. The cookie-based JWT is sent automatically via
 * `withCredentials`, so the server authenticates the handshake. Connection is
 * lazy and shared across boards; callers manage rooms via `board:join`.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}
