import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Message, Chat } from '../../types'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import { cn, formatMessageTime, getFullName } from '../../lib/utils'
import { getSocket, joinChat, leaveChat, sendTypingStart, sendTypingStop, markChatRead } from '../../lib/socket'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => (await api.get('/chats')).data.data,
  })

  const chat = chats?.find(c => c.id === chatId)

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => (await api.get(`/chats/${chatId}/messages`)).data.data,
    enabled: !!chatId,
  })

  const sendMessage = useMutation({
    mutationFn: (formData: FormData) => api.post(`/chats/${chatId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleSend = () => {
    if (!content.trim()) return
    const fd = new FormData()
    fd.append('content', content)
    sendMessage.mutate(fd)
  }

  useEffect(() => {
    if (!chatId) return
    const socket = getSocket()
    if (!socket) return

    joinChat(chatId)
    markChatRead(chatId)

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId !== chatId) return
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old
        return { ...old, messages: [...old.messages, msg] }
      })
      markChatRead(chatId)
    }

    const handleTyping = ({ userId, chatId: cId }: { userId: string; chatId: string }) => {
      if (cId !== chatId || userId === user?.id) return
      setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId])
    }

    const handleStopTyping = ({ userId, chatId: cId }: { userId: string; chatId: string }) => {
      if (cId !== chatId) return
      setTypingUsers(prev => prev.filter(id => id !== userId))
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleTyping)
    socket.on('user_stopped_typing', handleStopTyping)

    return () => {
      leaveChat(chatId)
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleTyping)
      socket.off('user_stopped_typing', handleStopTyping)
    }
  }, [chatId, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData?.messages?.length])

  const handleTyping = () => {
    sendTypingStart(chatId!)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => sendTypingStop(chatId!), 2000)
  }

  const other = chat?.type === 'PRIVATE'
    ? chat.members.find(m => m.user.id !== user?.id)?.user
    : null

  const chatName = chat?.type === 'GROUP' ? chat.name : getFullName(other?.profile)
  const messages: Message[] = messagesData?.messages ?? []

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/app/messages')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden">
          <ArrowLeft size={20} />
        </button>
        <Avatar
          src={other?.profile?.avatarUrl ?? chat?.avatarUrl}
          firstName={other?.profile?.firstName ?? chat?.name ?? 'G'}
          lastName={other?.profile?.lastName}
          size="sm"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{chatName}</p>
          <p className="text-xs text-slate-400">
            {chat?.type === 'GROUP'
              ? `${chat.members.length} members`
              : other?.role?.toLowerCase()
            }
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isOwn = msg.sender.id === user?.id
              const prevMsg = messages[i - 1]
              const showAvatar = !isOwn && (i === 0 || prevMsg?.sender.id !== msg.sender.id)

              return (
                <div key={msg.id} className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
                  {!isOwn && (
                    <div className="w-7 shrink-0">
                      {showAvatar && (
                        <Avatar
                          src={msg.sender.profile?.avatarUrl}
                          firstName={msg.sender.profile?.firstName}
                          lastName={msg.sender.profile?.lastName}
                          size="xs"
                        />
                      )}
                    </div>
                  )}

                  <div className={cn('max-w-xs lg:max-w-md', isOwn && 'items-end', 'flex flex-col gap-1')}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-slate-400 px-1">
                        {getFullName(msg.sender.profile)}
                      </span>
                    )}
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isOwn
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-surface-700 text-slate-800 dark:text-slate-200 shadow-card rounded-bl-sm'
                      )}
                    >
                      {msg.isDeleted ? (
                        <span className="italic opacity-60">Message deleted</span>
                      ) : (
                        <>
                          {msg.replyTo && (
                            <div className="border-l-2 border-current/30 pl-2 mb-1 opacity-70 text-xs">
                              {msg.replyTo.content}
                            </div>
                          )}
                          {msg.content}
                          {msg.attachments.map(att => (
                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 mt-1 text-xs underline">
                              📎 {att.fileName}
                            </a>
                          ))}
                        </>
                      )}
                    </div>
                    <span className="text-xs text-slate-300 px-1">
                      {formatMessageTime(msg.createdAt)}
                      {msg.isEdited && ' · edited'}
                    </span>
                  </div>
                </div>
              )
            })}

            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
                <span>typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-surface-800 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); handleTyping() }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full input-base resize-none pr-10 py-3 max-h-32"
              style={{ overflow: 'hidden' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!content.trim() || sendMessage.isPending}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
