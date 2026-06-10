import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MessageSquare } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Chat, User } from '../../types'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { getFullName, formatRelativeTime, truncate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [chatType, setChatType] = useState<'private' | 'group'>('private')

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => (await api.get('/chats')).data.data,
    refetchInterval: 30000,
  })

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`)
    setSearchResults(res.data.data?.users ?? [])
  }

  const createChat = useMutation({
    mutationFn: async () => {
      if (chatType === 'private') {
        return api.post('/chats/private', { userId: selectedUsers[0].id })
      } else {
        return api.post('/chats/group', {
          name: groupName,
          memberIds: selectedUsers.map(u => u.id),
        })
      }
    },
    onSuccess: (res) => {
      const chatId = res.data.data.id
      setShowNewChat(false)
      setSelectedUsers([])
      setGroupName('')
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      navigate(`/app/messages/${chatId}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
        <Button size="sm" onClick={() => setShowNewChat(true)}>
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !chats?.length ? (
        <div className="card p-12 text-center">
          <MessageSquare size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No conversations yet</p>
          <Button onClick={() => setShowNewChat(true)}>Start a conversation</Button>
        </div>
      ) : (
        <div className="card divide-y divide-slate-50 dark:divide-slate-700/50">
          {chats.map((chat: Chat) => {
            const other = chat.type === 'PRIVATE'
              ? chat.members.find(m => m.user.id !== user?.id)?.user
              : null
            const lastMsg = chat.messages?.[0]
            return (
              <button
                key={chat.id}
                onClick={() => navigate(`/app/messages/${chat.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors text-left"
              >
                <Avatar
                  src={other?.profile?.avatarUrl ?? chat.avatarUrl}
                  firstName={other?.profile?.firstName ?? chat.name ?? 'G'}
                  lastName={other?.profile?.lastName}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {chat.type === 'GROUP' ? chat.name : getFullName(other?.profile)}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {lastMsg?.isDeleted
                      ? 'Message deleted'
                      : lastMsg?.content
                        ? truncate(lastMsg.content, 60)
                        : lastMsg?.attachments?.length
                          ? '📎 Attachment'
                          : 'No messages yet'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* New Chat Modal */}
      <Modal isOpen={showNewChat} onClose={() => setShowNewChat(false)} title="New Conversation" size="md">
        <div className="space-y-4">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setChatType('private')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${chatType === 'private' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Private Chat
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${chatType === 'group' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Group Chat
            </button>
          </div>

          {chatType === 'group' && (
            <Input
              label="Group Name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          )}

          <Input
            label="Search Users"
            value={searchUser}
            onChange={e => { setSearchUser(e.target.value); searchUsers(e.target.value) }}
            placeholder="Search by name or email..."
            leftIcon={<Search size={16} />}
          />

          {searchResults.length > 0 && (
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (chatType === 'private') {
                      setSelectedUsers([u])
                    } else {
                      setSelectedUsers(prev =>
                        prev.find(p => p.id === u.id) ? prev.filter(p => p.id !== u.id) : [...prev, u]
                      )
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
                >
                  <Avatar src={u.profile?.avatarUrl} firstName={u.profile?.firstName} lastName={u.profile?.lastName} size="sm" />
                  <span className="text-sm text-slate-800">{getFullName(u.profile)}</span>
                  {selectedUsers.find(s => s.id === u.id) && <span className="ml-auto text-primary-600">✓</span>}
                </button>
              ))}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <span key={u.id} className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                  {getFullName(u.profile)}
                  <button onClick={() => setSelectedUsers(prev => prev.filter(p => p.id !== u.id))}>×</button>
                </span>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => createChat.mutate()}
            disabled={selectedUsers.length === 0 || (chatType === 'group' && !groupName.trim())}
            isLoading={createChat.isPending}
          >
            {chatType === 'private' ? 'Start Chat' : 'Create Group'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
