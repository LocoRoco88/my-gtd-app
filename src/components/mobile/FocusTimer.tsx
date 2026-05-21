'use client'

import { useEffect } from 'react'
import { useStore, ChecklistItem } from '@/lib/store'
import { Pause, Play, CheckCircle2, Square } from 'lucide-react'

export function FocusTimer() {
  const { 
    activeTaskId, 
    tasks, 
    updateTask,
    focusState, 
    activeTimeElapsedSeconds, 
    interruptedTimeElapsedSeconds,
    tickTimer,
    interruptFocus,
    resumeFocus,
    stopFocus,
    completeFocus
  } = useStore()

  useEffect(() => {
    if (focusState === 'IDLE') return
    const interval = setInterval(() => {
      tickTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [focusState, tickTimer])

  const task = tasks.find(t => t.id === activeTaskId)
  if (!task) return null

  const checklist = task.checklist || []
  const hasChecklist = checklist.length > 0
  
  const completedCount = checklist.filter((c: ChecklistItem) => c.is_completed).length
  const totalCount = checklist.length
  const firstUncompletedIndex = checklist.findIndex((c: ChecklistItem) => !c.is_completed)
  const currentStep = firstUncompletedIndex !== -1 ? checklist[firstUncompletedIndex] : null

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-full duration-500 ease-out">
      {/* Dynamic Background based on state */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
        focusState === 'ACTIVE_WORKING' ? 'bg-brand-500' : 'bg-orange-500'
      }`}></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Status Indicator */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-8 transition-colors duration-500 ${
          focusState === 'ACTIVE_WORKING' 
            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' 
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
        }`}>
          {focusState === 'ACTIVE_WORKING' ? 'Deep Focus' : 'Interrupted'}
        </div>

        {/* Progress Indicator */}
        {hasChecklist && currentStep && (
          <div className="w-full mb-8 flex flex-col items-center">
            <span className="text-sm font-bold text-muted mb-3 uppercase tracking-widest">
              Step {firstUncompletedIndex + 1} of {totalCount}
            </span>
            <div className="w-full h-1.5 bg-surface border border-surface-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Title / Sequential Step */}
        {hasChecklist && currentStep ? (
          <div className="flex flex-col items-center mb-12 w-full animate-in slide-in-from-right-8 fade-in duration-500" key={currentStep.id}>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 opacity-50 text-center">{task.title}</h3>
            <h2 className="text-3xl font-black text-center leading-tight tracking-tight text-foreground">{currentStep.text}</h2>
          </div>
        ) : (
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">{task.title}</h2>
        )}

        {/* Timer Display */}
        <div className="relative mb-16">
          {focusState === 'ACTIVE_WORKING' ? (
            <div className="text-8xl font-black tabular-nums tracking-tighter text-brand-600 dark:text-brand-400 drop-shadow-lg">
              {formatTime(activeTimeElapsedSeconds)}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-8xl font-black tabular-nums tracking-tighter text-muted opacity-50">
                {formatTime(activeTimeElapsedSeconds)}
              </div>
              <div className="absolute -bottom-8 text-orange-500 font-bold flex items-center gap-2 animate-pulse">
                Leakage: {formatTime(interruptedTimeElapsedSeconds)}
              </div>
            </div>
          )}
        </div>

        {/* Step Completion Button */}
        {hasChecklist && currentStep && focusState === 'ACTIVE_WORKING' && (
          <div className="w-full mb-8">
            <button 
              onClick={() => {
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                  audio.play().catch(()=>null)
                } catch(e) {}
                
                const updatedChecklist = checklist.map((c: ChecklistItem) => c.id === currentStep.id ? { ...c, is_completed: true } : c)
                updateTask(task.id, { checklist: updatedChecklist })
                
                if (completedCount + 1 === totalCount) {
                  setTimeout(() => completeFocus(), 500)
                }
              }}
              className="w-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 border-2 border-brand-200 dark:border-brand-800 py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-inner"
            >
              <CheckCircle2 size={24} /> Step Completed
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full">
          {focusState === 'ACTIVE_WORKING' ? (
            <button 
              onClick={interruptFocus}
              className="w-full bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark border-2 border-surface-border py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Pause fill="currentColor" /> Interrupted
            </button>
          ) : (
            <button 
              onClick={resumeFocus}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Play fill="currentColor" /> Resume Work
            </button>
          )}

          <div className="flex gap-4 mt-4">
            <button 
              onClick={stopFocus}
              className="flex-1 bg-surface border border-surface-border hover:border-red-500 hover:text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Square size={18} /> Stop
            </button>
            <button 
              onClick={completeFocus}
              className="flex-1 bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 size={18} /> Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
