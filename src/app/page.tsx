'use client'

import { useEffect, useState } from 'react'
import { DesktopHub } from '@/components/desktop/DesktopHub'
import { MobileHub } from '@/components/mobile/MobileHub'
import { AuthScreen } from '@/components/ui/AuthScreen'
import { GhostTimerFAB } from '@/components/ui/GhostTimerFAB'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { user, setUser, fetchInitialData } = useStore()

  useEffect(() => {
    if (user) {
      fetchInitialData()
    }
  }, [user, fetchInitialData])

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  if (!mounted) {
    return <div className="h-[100dvh] w-full bg-background" /> // blank skeleton
  }

  // If no user is logged in, show Auth Screen
  if (!user) {
    return <AuthScreen />
  }

  return (
    <main className="h-[100dvh] w-full bg-background flex flex-col font-sans overflow-hidden relative">
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:flex flex-1 w-full h-full">
        <DesktopHub />
      </div>

      {/* Mobile View - Hidden on desktop */}
      <div className="block md:hidden flex-1 w-full h-full relative">
        <MobileHub />
      </div>

      <GhostTimerFAB />
    </main>
  )
}

