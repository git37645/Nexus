import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { Post } from '../../types'
import PostCard from '../../features/feed/PostCard'

export default function FeedPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/posts/feed?page=${pageParam}`)
      return res.data.data
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
  })

  const createPost = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('content', content)
      images.forEach(img => formData.append('images', img))
      return api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      setContent('')
      setImages([])
      setPreviews([])
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Post published!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages(prev => [...prev, ...files].slice(0, 10))
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string].slice(0, 10))
      reader.readAsDataURL(f)
    })
  }

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const posts = data?.pages.flatMap(p => p.posts) ?? []

  return (
    <div className="page-container max-w-2xl">
      {/* Create post */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <Avatar
            src={user?.profile?.avatarUrl}
            firstName={user?.profile?.firstName}
            lastName={user?.profile?.lastName}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full resize-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-900"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <label className="cursor-pointer flex items-center gap-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                <Image size={18} />
                <span className="text-sm">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>

              <Button
                size="sm"
                onClick={() => createPost.mutate()}
                disabled={!content.trim() && images.length === 0}
                isLoading={createPost.isPending}
              >
                <Send size={14} />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
