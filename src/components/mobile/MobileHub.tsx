'use client'

import { useState } from 'react'
import { useStore, Task } from '@/lib/store'
import { Plus, Maximize, Play, Circle, ListTodo, CalendarClock, MapPin, Utensils } from 'lucide-react'
import { MoleskineView } from './MoleskineView'
import { TimelineView } from './TimelineView'
import { FocusTimer } from './FocusTimer'
import { CaptureBar } from './CaptureBar'
import { ContextSelector } from './ContextSelector'
import { MealPlanSlot } from './MealPlanSlot'

export function MobileHub() {
  const { mobileTab, setMobileTab, focusState, activeTaskId } = useStore()
  
  if (focusState !== 'IDLE') {
    return <FocusTimer />
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative">
      {/* Top Header / Context & Meals */}
      <header className="px-4 py-3 border-b border-surface-border bg-surface/80 backdrop-blur flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            GTD
          </div>
          <span className="font-bold tracking-tight">On The Move</span>
        </div>
        <div className="flex items-center gap-3">
          <ContextSelector />
          <MealPlanSlot />
        </div>
      </header>

      {/* Main Content Area: Moleskine or Timeline */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
        {/* Toggle UI */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur px-4 py-3 mb-1 flex justify-center">
          <div className="flex bg-surface-hover-light dark:bg-surface-hover-dark p-1 rounded-full border border-surface-border shadow-inner w-full max-w-sm mx-auto">
            <button
              onClick={() => setMobileTab('moleskine')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-all ${
                mobileTab === 'moleskine' 
                  ? 'bg-white dark:bg-surface-dark text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-muted'
              }`}
            >
              <ListTodo size={16} /> List
            </button>
            <button
              onClick={() => setMobileTab('timeline')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-full transition-all ${
                mobileTab === 'timeline' 
                  ? 'bg-white dark:bg-surface-dark text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-muted'
              }`}
            >
              <CalendarClock size={16} /> Timeline
            </button>
          </div>
        </div>

        <div className="px-4">
          {mobileTab === 'moleskine' ? <MoleskineView /> : <TimelineView />}
        </div>
      </div>

      {/* Frictionless Capture (Sticky Bottom) */}
      <CaptureBar />
    </div>
  )
}
