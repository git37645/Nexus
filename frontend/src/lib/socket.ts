import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.debug('[Socket] Connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.debug('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinChat(chatId: string) {
  socket?.emit('join_chat', chatId)
}

export function leaveChat(chatId: string) {
  socket?.emit('leave_chat', chatId)
}

export function sendTypingStart(chatId: string) {
  socket?.emit('typing_start', chatId)
}

export function sendTypingStop(chatId: string) {
  socket?.emit('typing_stop', chatId)
}

export function markChatRead(chatId: string) {
  socket?.emit('mark_read', { chatId })
}
