'use client'

import { useEffect, useState } from 'react'
import { useStore, Task, ChecklistItem } from '@/lib/store'
import { Play, Pause, Square, Check, X, Clock } from 'lucide-react'

export function FocusTrackerBar() {
  const { 
    focusState, 
    activeTaskId, 
    activeChecklistItemId, 
    activeTimeElapsedSeconds, 
    tickTimer, 
    interruptFocus, 
    resumeFocus, 
    stopFocus, 
    completeFocus,
    tasks 
  } = useStore()
  
  const [showStopPrompt, setShowStopPrompt] = useState(false)

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (focusState === 'ACTIVE_WORKING') {
      interval = setInterval(() => {
        tickTimer()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [focusState, tickTimer])

  if (!activeTaskId || focusState === 'IDLE') return null

  const task = tasks.find((t: Task) => t.id === activeTaskId)
  if (!task) return null

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  let title = task.title
  if (activeChecklistItemId && task.checklist) {
    const checkItem = task.checklist.find((c: ChecklistItem) => c.id === activeChecklistItemId)
    if (checkItem) {
      title = `${task.title} → ${checkItem.text}`
    }
  }

  const handleStopClick = () => {
    if (focusState === 'ACTIVE_WORKING') {
      interruptFocus() // Pause while prompting
    }
    setShowStopPrompt(true)
  }

  const handleMarkDone = () => {
    setShowStopPrompt(false)
    completeFocus()
  }

  const handleKeepOpen = () => {
    setShowStopPrompt(false)
    stopFocus()
  }

  return (
    <>
      <div className="bg-brand-900 text-white shadow-lg border-b border-brand-800 flex items-center justify-between px-6 py-3 w-full z-40 relative animate-in slide-in-from-top-full">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <div className="flex flex-col">
            <span className="font-bold text-sm truncate max-w-[500px] leading-tight">{title}</span>
            <div className="flex items-center gap-2 mt-0.5 opacity-80 text-[10px] uppercase font-bold tracking-wider">
              {task.context && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded">{task.context.replace(/[\[\]]/g, '')}</span>
              )}
              {task.time_estimate_minutes && (
                <span className="flex items-center gap-0.5"><Clock size={10} /> {task.time_estimate_minutes}m est</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-2xl font-mono font-bold tabular-nums tracking-tight">
            {formatTime(activeTimeElapsedSeconds)}
          </div>

          <div className="flex items-center gap-2">
            {focusState === 'ACTIVE_WORKING' ? (
              <button 
                onClick={interruptFocus}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Pause"
              >
                <Pause size={18} className="fill-current" />
              </button>
            ) : (
              <button 
                onClick={resumeFocus}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Resume"
              >
                <Play size={18} className="fill-current ml-0.5" />
              </button>
            )}

            <button 
              onClick={handleStopClick}
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors text-white shadow-sm"
              title="Stop"
            >
              <Square size={16} className="fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Stop Prompt Modal */}
      {showStopPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-foreground">Is this action fully completed?</h3>
            <p className="text-muted text-sm mb-6">You've tracked {formatTime(activeTimeElapsedSeconds)}. Do you want to mark this task as done?</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleMarkDone}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-sm"
              >
                <Check size={18} /> Yes, Mark as Done
              </button>
              
              <button 
                onClick={handleKeepOpen}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border border border-surface-border text-foreground rounded-xl font-bold transition-all"
              >
                <Pause size={18} /> No, Keep Action Open
              </button>
            </div>
            
            <button 
              onClick={() => { setShowStopPrompt(false); resumeFocus(); }}
              className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-muted hover:text-foreground text-xs font-semibold transition-colors"
            >
              <X size={14} /> Cancel & Resume Tracking
            </button>
          </div>
        </div>
      )}
    </>
  )
}
