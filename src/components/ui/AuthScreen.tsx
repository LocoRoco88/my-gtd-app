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
