import { Link } from 'react-router-dom'
import { Shield, MessageSquare, GraduationCap, Users, Lock, Zap } from 'lucide-react'
import Logo from '../components/layout/Logo'

const features = [
  { icon: MessageSquare, title: 'Secure Messaging', description: 'Private and group chats with real-time delivery. Your conversations stay private — always.' },
  { icon: GraduationCap, title: 'Academic Courses', description: 'Lectures, assignments, deadlines, and grades — all in one place for students and teachers.' },
  { icon: Users, title: 'University Feed', description: 'Share posts, updates, and academic content with your university community.' },
  { icon: Shield, title: 'Privacy First', description: 'Role-based access, end-to-end encryption architecture, and transparent moderation.' },
  { icon: Lock, title: 'Secure Auth', description: 'JWT tokens, 2FA, refresh rotation, and brute-force protection keep your account safe.' },
  { icon: Zap, title: 'Real-time', description: 'WebSocket-powered live messaging, notifications, and typing indicators.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          Closed University Network
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
          Your University,
          <br />
          <span className="text-primary-600">Connected.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Nexus brings together secure messaging, academic courses, and social collaboration in one private platform built for university communities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Create Account
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need</h2>
          <p className="text-slate-500 text-lg">A complete platform for modern university life</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="card p-10">
          <Logo size="lg" className="justify-center mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to connect?</h2>
          <p className="text-slate-500 mb-6">Join your university's secure communication platform today.</p>
          <Link to="/register" className="btn-primary">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          <Logo size="sm" className="justify-center mb-3" />
          <p>© 2024 Nexus University Platform. Closed network — university use only.</p>
        </div>
      </footer>
    </div>
  )
}
