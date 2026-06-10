import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Send, Flag } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Post } from '../../types'
import Avatar from '../../components/ui/Avatar'
import { cn, formatRelativeTime, getFullName } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportType, setReportType] = useState('SPAM')
  const [reportDesc, setReportDesc] = useState('')

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/save`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/comments`, { content: commentText }),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reportMutation = useMutation({
    mutationFn: () => api.post('/reports', {
      contentType: 'POST',
      contentId: post.id,
      targetUserId: post.author.id,
      reportType,
      description: reportDesc,
    }),
    onSuccess: () => {
      setShowReport(false)
      toast.success('Report submitted. Thank you for keeping Nexus safe.')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deletePost = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Post deleted')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const isOwner = user?.id === post.author.id

  return (
    <>
      <article className="card p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <button
            onClick={() => navigate(`/app/profile/${post.author.id}`)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={post.author.profile?.avatarUrl}
              firstName={post.author.profile?.firstName}
              lastName={post.author.profile?.lastName}
              size="md"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getFullName(post.author.profile)}
              </p>
              <p className="text-xs text-slate-400">
                {post.author.profile?.faculty ?? post.author.role.toLowerCase()}
                {' · '}
                {formatRelativeTime(post.createdAt)}
                {post.isEdited && ' · edited'}
              </p>
            </div>
          </button>

          <div className="relative">
            {(isOwner || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
              <button
                onClick={() => deletePost.mutate()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete post"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Images */}
        {post.images?.length > 0 && (
          <div className={cn(
            'grid gap-2 mb-3 rounded-xl overflow-hidden',
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
          )}>
            {post.images.slice(0, 4).map((img, i) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-56 object-cover"
                />
                {i === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">+{post.images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-slate-50 dark:border-slate-700/50">
          <button
            onClick={() => likeMutation.mutate()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              post.isLiked
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950'
                : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'
            )}
          >
            <Heart size={16} className={post.isLiked ? 'fill-current' : ''} />
            <span>{post._count.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <MessageSquare size={16} />
            <span>{post._count.comments}</span>
          </button>

          <button
            onClick={() => saveMutation.mutate()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              post.isSaved
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950'
                : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'
            )}
          >
            <Bookmark size={16} className={post.isSaved ? 'fill-current' : ''} />
          </button>

          <button
            onClick={() => setShowReport(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Flag size={14} />
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-3">
            {post.comments?.map(comment => (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar
                  src={comment.author.profile?.avatarUrl}
                  firstName={comment.author.profile?.firstName}
                  lastName={comment.author.profile?.lastName}
                  size="xs"
                />
                <div className="flex-1 bg-slate-50 dark:bg-surface-700 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {getFullName(comment.author.profile)}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2.5 mt-3">
              <Avatar
                src={user?.profile?.avatarUrl}
                firstName={user?.profile?.firstName}
                lastName={user?.profile?.lastName}
                size="xs"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                      e.preventDefault()
                      commentMutation.mutate()
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 input-base py-2 text-sm"
                />
                <button
                  onClick={() => commentText.trim() && commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Report Modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="Report Post" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="input-base"
            >
              {['HARASSMENT', 'SPAM', 'ILLEGAL_CONTENT', 'THREATS', 'ACADEMIC_CHEATING', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'OTHER'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Additional details (optional)</label>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              rows={3}
              placeholder="Describe the issue..."
              className="input-base resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowReport(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => reportMutation.mutate()} isLoading={reportMutation.isPending}>
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
