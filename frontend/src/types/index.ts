export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPERADMIN'
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'PENDING_VERIFICATION'
export type PostVisibility = 'UNIVERSITY' | 'GROUP' | 'COURSE' | 'FOLLOWERS'
export type AssignmentStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE'
export type ReportType = 'HARASSMENT' | 'SPAM' | 'ILLEGAL_CONTENT' | 'THREATS' | 'ACADEMIC_CHEATING' | 'HATE_SPEECH' | 'INAPPROPRIATE_CONTENT' | 'OTHER'
export type NotificationType = 'MESSAGE' | 'COMMENT' | 'LIKE' | 'ASSIGNMENT' | 'DEADLINE' | 'GRADE' | 'LECTURE' | 'ANNOUNCEMENT' | 'REPORT_REVIEWED' | 'SYSTEM'

export interface Profile {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  bio?: string
  faculty?: string
  department?: string
  group?: string
  studentId?: string
  phoneNumber?: string
}

export interface User {
  id: string
  email: string
  role: Role
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  lastActiveAt?: string
  profile?: Profile
  privacySettings?: PrivacySettings
  twoFactorSecret?: { isEnabled: boolean }
}

export interface PrivacySettings {
  profileVisibility: string
  postVisibility: string
  messagePermission: string
  groupAddPermission: string
  showOnlineStatus: boolean
  showReadReceipts: boolean
}

export interface PostImage {
  id: string
  url: string
  fileName: string
  order: number
}

export interface Comment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  author: User
  replies?: Comment[]
}

export interface Post {
  id: string
  content: string
  visibility: PostVisibility
  isEdited: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: User
  images: PostImage[]
  _count: { likes: number; comments: number }
  isLiked?: boolean
  isSaved?: boolean
  comments?: Comment[]
}

export interface Message {
  id: string
  chatId: string
  content?: string
  isEdited: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  sender: User
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  replyTo?: Message
}

export interface MessageAttachment {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface MessageReaction {
  id: string
  emoji: string
  user: User
}

export interface Chat {
  id: string
  type: 'PRIVATE' | 'GROUP'
  name?: string
  avatarUrl?: string
  members: ChatMember[]
  messages?: Message[]
  updatedAt: string
}

export interface ChatMember {
  id: string
  role: 'OWNER' | 'MODERATOR' | 'MEMBER'
  joinedAt: string
  user: User
}

export interface Course {
  id: string
  name: string
  code: string
  description?: string
  semester?: string
  year?: number
  isActive: boolean
  teacher: User
  _count: { members: number; lectures: number; assignments: number }
}

export interface Lecture {
  id: string
  title: string
  description?: string
  content?: string
  order: number
  isPublished: boolean
  createdAt: string
  attachments: LectureAttachment[]
}

export interface LectureAttachment {
  id: string
  url: string
  fileName: string
  mimeType: string
  attachType: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  deadline: string
  maxScore: number
  allowResubmit: boolean
  submissions?: AssignmentSubmission[]
  _count?: { submissions: number }
}

export interface AssignmentSubmission {
  id: string
  content?: string
  status: AssignmentStatus
  submittedAt?: string
  files: SubmissionFile[]
  grade?: Grade
}

export interface SubmissionFile {
  id: string
  url: string
  fileName: string
  mimeType: string
}

export interface Grade {
  id: string
  score: number
  feedback?: string
  createdAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface Report {
  id: string
  contentType: string
  contentId: string
  reportType: ReportType
  description?: string
  status: string
  createdAt: string
  reporter: User
  targetUser?: User
  reviewedBy?: User
  actionTaken?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
