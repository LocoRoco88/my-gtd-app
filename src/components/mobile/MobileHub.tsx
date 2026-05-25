'use client'

import { useState, useEffect } from 'react'
import { useStore, Task } from '@/lib/store'
import { Plus, Maximize, Play, Circle, ListTodo, CalendarClock, MapPin, Utensils, Pause, Square, Check, X } from 'lucide-react'
import { MoleskineView } from './MoleskineView'
import { TimelineView } from './TimelineView'
import { FocusTimer } from './FocusTimer'
import { CaptureBar } from './CaptureBar'
import { ContextSelector } from './ContextSelector'
import { MealPlanSlot } from './MealPlanSlot'

export function MobileHub() {
  const { 
    mobileTab, 
    setMobileTab, 
    focusState, 
    activeTaskId, 
    isGhostTimer,
    activeTimeElapsedSeconds,
    interruptFocus,
    resumeFocus,
    stopFocus,
    completeFocus,
    tasks,
    updateTask
  } = useStore()

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showStopPrompt, setShowStopPrompt] = useState(false)

  const activeTask = tasks.find(t => t.id === activeTaskId)
  
  useEffect(() => {
    if (activeTask) {
      setNameInput(activeTask.title)
    }
  }, [activeTask?.title])
  
  if (focusState !== 'IDLE' && !isGhostTimer) {
    return <FocusTimer />
  }

  return (
    <div className="flex flex-col w-full h-full bg-background text-foreground relative">
      {/* Top Header / Context & Meals */}
      <header className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-surface-border bg-surface/80 backdrop-blur flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            GTD
          </div>
          <span className="font-bold tracking-tight max-[380px]:hidden">On The Move</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ContextSelector />
          <MealPlanSlot />
        </div>
      </header>

      {/* Ghost Timer Top Bar for Mobile */}
      {focusState !== 'IDLE' && isGhostTimer && activeTask && (
        <div className="bg-brand-900 text-white px-4 py-2 flex items-center justify-between z-30 relative animate-in slide-in-from-top-full text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingName(false)
                    if (nameInput.trim() !== '') {
                      updateTask(activeTask.id, { title: nameInput.trim() })
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false)
                      if (nameInput.trim() !== '') {
                        updateTask(activeTask.id, { title: nameInput.trim() })
                      }
                    }
                  }}
                  className="bg-white/10 text-white font-bold text-xs px-2 py-0.5 rounded outline-none border border-white/20 w-full"
                  autoFocus
                />
              ) : (
                <span 
                  onClick={() => setIsEditingName(true)}
                  className="font-bold truncate block hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer"
                >
                  {activeTask.title || <span className="italic text-white/50 text-[10px]">Untitled (Tap to name)</span>}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono font-bold tabular-nums">
              {(() => {
                const m = Math.floor(activeTimeElapsedSeconds / 60)
                const s = activeTimeElapsedSeconds % 60
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
              })()}
            </span>

            <div className="flex items-center gap-1.5">
              {focusState === 'ACTIVE_WORKING' ? (
                <button 
                  onClick={interruptFocus}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <Pause size={12} fill="currentColor" />
                </button>
              ) : (
                <button 
                  onClick={resumeFocus}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                </button>
              )}
              <button 
                onClick={() => {
                  if (focusState === 'ACTIVE_WORKING') {
                    interruptFocus()
                  }
                  setShowStopPrompt(true)
                }}
                className="w-7 h-7 rounded-full bg-red-505 hover:bg-red-600 flex items-center justify-center text-white"
              >
                <Square size={10} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Stop Prompt Modal for Mobile */}
      {showStopPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 text-foreground">
            <h3 className="text-xl font-bold mb-2">Is this action fully completed?</h3>
            <p className="text-muted text-sm mb-6">
              You've tracked {(() => {
                const m = Math.floor(activeTimeElapsedSeconds / 60)
                const s = activeTimeElapsedSeconds % 60
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
              })()}. Do you want to mark this task as done?
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => {
                  setShowStopPrompt(false)
                  await completeFocus()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-sm"
              >
                <Check size={18} /> Yes, Mark as Done
              </button>
              
              <button 
                onClick={async () => {
                  setShowStopPrompt(false)
                  await stopFocus()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border border border-surface-border text-foreground rounded-xl font-bold transition-all"
              >
                <Pause size={18} /> No, Keep Action Open
              </button>
            </div>
            
            <button 
              onClick={() => {
                setShowStopPrompt(false)
                resumeFocus()
              }}
              className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-muted hover:text-foreground text-xs font-semibold transition-colors"
            >
              <X size={14} /> Cancel & Resume Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
