'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await api.signInWithEmail(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await api.signInWithGoogle()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 font-sans">
        <div className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Check your email</h2>
          <p className="text-muted mb-8">We&apos;ve sent a magic login link to <strong>{email}</strong>. Click the link to access your GTD system.</p>
          <button 
            onClick={() => setSent(false)}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 font-sans relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass max-w-sm w-full p-8 rounded-3xl shadow-2xl relative z-10 border border-surface-border">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30 text-xl">
            GTD
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">MyGTD OS</h1>
          <p className="text-sm text-muted mt-2">Log in to your private Life Operating System</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-inner"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !email}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Magic Link'}
          </button>
        </form>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-foreground font-bold py-3 px-4 rounded-xl border border-surface-border transition-all flex items-center justify-center gap-2 mt-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.23 2.68 1.255 6.618l3.99 3.147z"
            />
            <path
              fill="#FBBC05"
              d="M16.04 15.345c-1.037.664-2.34 1.055-4.04 1.055a7.08 7.08 0 0 1-6.733-4.855L1.255 14.69A11.96 11.96 0 0 0 12 24c3.273 0 6.09-1.073 8.127-2.918l-4.086-5.737z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.436a5.51 5.51 0 0 1-2.386 3.618l4.086 5.736c2.39-2.2 3.764-5.436 3.764-9.49z"
            />
            <path
              fill="#34A853"
              d="M5.266 14.236A7.07 7.07 0 0 1 4.91 12c0-.79.136-1.545.355-2.235L1.255 6.618C.455 8.218 0 10.055 0 12c0 1.945.455 3.782 1.255 5.382l4.01-3.146z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <span className="relative bg-surface px-3 text-xs uppercase tracking-widest text-muted">Or Explore</span>
        </div>

        <button 
          onClick={() => {
            // Set a mock user in Zustand store to bypass AuthScreen
            useStore.getState().setUser({ id: 'demo-user', email: 'demo@gtd.os' } as any)
          }}
          className="w-full bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-bold py-3 px-4 rounded-xl border border-surface-border transition-all flex items-center justify-center gap-2"
        >
          Enter Offline Demo Mode
        </button>
      </div>
    </div>
  )
}
