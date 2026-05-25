'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore, Task } from '@/lib/store'
import { Play, Pause, Square, Check, X } from 'lucide-react'

export function GhostTimerFAB() {
  const {
    focusState,
    activeTaskId,
    isGhostTimer,
    activeTimeElapsedSeconds,
    tickTimer,
    startFocus,
    interruptFocus,
    resumeFocus,
    stopFocus,
    completeFocus,
    setGhostTimer,
    addTask,
    updateTask,
    tasks
  } = useStore()

  const [isOpen, setIsOpen] = useState(false)
  const [showStopPrompt, setShowStopPrompt] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Timer ticking if active and is ghost timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (focusState === 'ACTIVE_WORKING' && isGhostTimer) {
      interval = setInterval(() => {
        tickTimer()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [focusState, isGhostTimer, tickTimer])

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get active task if ghost timer is active
  const activeTask = isGhostTimer && activeTaskId ? tasks.find(t => t.id === activeTaskId) : null

  // Update input field when active task changes or is named
  useEffect(() => {
    if (activeTask) {
      setInputValue(activeTask.title)
    } else {
      setInputValue('')
    }
  }, [activeTask])

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartGhostTimer = async () => {
    const tempTaskId = crypto.randomUUID()
    const newTask: Task = {
      id: tempTaskId,
      title: '',
      status: 'next_action',
      type: 'standard',
      is_routine: false,
      context: null
    }

    await addTask(newTask)
    setGhostTimer(true)
    startFocus(tempTaskId)
    setIsOpen(true) // Open naming dialog immediately
  }

  const handleSaveName = async () => {
    if (activeTask) {
      await updateTask(activeTask.id, { title: inputValue })
    }
  }

  const handleStopClick = () => {
    if (focusState === 'ACTIVE_WORKING') {
      interruptFocus()
    }
    setShowStopPrompt(true)
    setIsOpen(false)
  }

  const handleMarkDone = async () => {
    setShowStopPrompt(false)
    await completeFocus()
  }

  const handleKeepOpen = async () => {
    setShowStopPrompt(false)
    await stopFocus()
  }

  const handleCancelResume = () => {
    setShowStopPrompt(false)
    resumeFocus()
  }

  // Only render active FAB state if there is an active ghost timer
  const isActive = focusState !== 'IDLE' && isGhostTimer

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Naming / Controls Popover */}
        {isOpen && isActive && activeTask && (
          <div 
            ref={popoverRef}
            className="mb-3 bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl p-4 w-72 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Quick Timer</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-semibold">Action Title</label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="What are you doing right now?"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-505 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-sans"
              />
            </div>

            {/* Popover Controls */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800">
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {formatTime(activeTimeElapsedSeconds)}
              </span>

              <div className="flex items-center gap-2">
                {focusState === 'ACTIVE_WORKING' ? (
                  <button 
                    onClick={interruptFocus}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
                  >
                    <Pause size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button 
                    onClick={resumeFocus}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
                  >
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </button>
                )}
                <button 
                  onClick={handleStopClick}
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-sm"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The FAB button itself */}
        {isActive ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-600 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none mb-0.5 animate-pulse">Live</span>
              <span className="text-sm sm:text-base font-mono font-black tabular-nums tracking-tight">
                {formatTime(activeTimeElapsedSeconds)}
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={handleStartGhostTimer}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950 text-white border border-zinc-800 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-zinc-900 active:scale-95 shadow-2xl cursor-pointer group relative overflow-hidden"
            title="Start Quick Timer"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-850 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Play size={20} fill="currentColor" className="relative z-10 ml-0.5 text-white transition-transform group-hover:scale-110" />
          </button>
        )}
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
              onClick={handleCancelResume}
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
