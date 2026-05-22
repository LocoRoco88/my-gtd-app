'use client'

import { useEffect, useState } from 'react'
import { useStore, ChecklistItem } from '@/lib/store'
import { Pause, Play, CheckCircle2, Square, Coffee, Sparkles, Bell } from 'lucide-react'

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

  // Local state for chosen focus mode option ('deep_work' | 'pomodoro' | null)
  const [focusModeOption, setFocusModeOption] = useState<'deep_work' | 'pomodoro' | null>(null)
  
  // Track if deep work alarm has played
  const [hasDeepWorkAlarmPlayed, setHasDeepWorkAlarmPlayed] = useState(false)

  const task = tasks.find(t => t.id === activeTaskId)

  // Control timer ticking: block ticking on the choice screen
  useEffect(() => {
    if (focusState === 'IDLE' || !task) return
    
    const needsChoice = (task.time_estimate_minutes || 0) > 30 && !focusModeOption
    if (needsChoice) return

    const interval = setInterval(() => {
      tickTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [focusState, tickTimer, task, focusModeOption])

  if (!task) return null

  const isLongTask = (task.time_estimate_minutes || 0) > 30
  const estimateMins = task.time_estimate_minutes || 30

  // 1. Choice Screen (Only for tasks > 30 mins, if no option chosen yet)
  if (isLongTask && !focusModeOption) {
    return (
      <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        {/* Decorative background glow */}
        <div className="absolute w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -top-20 -left-20"></div>
        <div className="absolute w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20"></div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 mb-6">
            GTD
          </div>
          <h2 className="text-2xl font-extrabold text-foreground text-center mb-1">Vælg Fokus-metode</h2>
          <p className="text-sm text-muted text-center mb-8 px-4">
            Opgaven <span className="font-bold text-foreground">"{task.title}"</span> er estimeret til {estimateMins} minutter.
          </p>

          <div className="flex flex-col gap-4 w-full mb-10">
            {/* Deep Work Flow Option */}
            <button
              onClick={() => setFocusModeOption('deep_work')}
              className="w-full text-left p-5 rounded-2xl bg-surface border border-surface-border hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col gap-1.5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-500">Deep Work</span>
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Deep Work Flow</span>
              <span className="text-xs text-muted leading-relaxed">
                Enkelt nedtællingsur til hele opgaven. Ideelt til dyb, uafbrudt koncentration.
              </span>
            </button>

            {/* Pomodoro Sprint Option */}
            <button
              onClick={() => setFocusModeOption('pomodoro')}
              className="w-full text-left p-5 rounded-2xl bg-surface border border-surface-border hover:border-orange-500 hover:shadow-md transition-all group flex flex-col gap-1.5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <Coffee size={16} className="text-orange-500" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-orange-500">Interval</span>
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400">Pomodoro Sprint</span>
              <span className="text-xs text-muted leading-relaxed">
                Arbejd i 25 minutter, hold pause i 5 minutter. Perfekt til at holde energien oppe.
              </span>
            </button>
          </div>

          <button
            onClick={stopFocus}
            className="w-full py-4 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark border border-surface-border text-foreground font-bold rounded-2xl transition-all text-sm active:scale-95 shadow-sm"
          >
            Annuller og gå tilbage
          </button>
        </div>
      </div>
    )
  }

  // Checklist items helper
  const checklist = task.checklist || []
  const hasChecklist = checklist.length > 0
  const completedCount = checklist.filter((c: ChecklistItem) => c.is_completed).length
  const totalCount = checklist.length
  const firstUncompletedIndex = checklist.findIndex((c: ChecklistItem) => !c.is_completed)
  const currentStep = firstUncompletedIndex !== -1 ? checklist[firstUncompletedIndex] : null

  // Timer Calculations based on Mode
  let isWork = true
  let isBreak = false
  let timerText = ''
  let statusText = 'Deep Focus'
  let isOvertime = false
  let activeTimeRemaining = 0
  
  // Pomodoro math
  const pomodoroCycleSeconds = 1800 // 30 minutes total (25 focus, 5 rest)
  const pomodoroWorkSeconds = 1500  // 25 minutes
  const pomodoroCycle = Math.floor(activeTimeElapsedSeconds / pomodoroCycleSeconds) + 1
  const cycleSeconds = activeTimeElapsedSeconds % pomodoroCycleSeconds

  if (focusModeOption === 'deep_work') {
    statusText = 'Deep Work'
    const totalSeconds = estimateMins * 60
    if (activeTimeElapsedSeconds > totalSeconds) {
      isOvertime = true
      activeTimeRemaining = activeTimeElapsedSeconds - totalSeconds
    } else {
      activeTimeRemaining = totalSeconds - activeTimeElapsedSeconds
    }
  } else if (focusModeOption === 'pomodoro') {
    isWork = cycleSeconds < pomodoroWorkSeconds
    isBreak = !isWork
    statusText = isWork ? `Sprint #${pomodoroCycle}` : 'Pause'
    activeTimeRemaining = isWork 
      ? pomodoroWorkSeconds - cycleSeconds 
      : pomodoroCycleSeconds - cycleSeconds
  } else {
    // Default timer (for tasks <= 30 mins)
    activeTimeRemaining = activeTimeElapsedSeconds
  }

  // 2. Play Alarm Sound effects
  // Alarm for Deep Work Completion
  useEffect(() => {
    if (focusModeOption === 'deep_work' && !hasDeepWorkAlarmPlayed && activeTimeElapsedSeconds >= estimateMins * 60) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        audio.play().catch(() => null)
      } catch (e) {}
      setHasDeepWorkAlarmPlayed(true)
    }
  }, [focusModeOption, activeTimeElapsedSeconds, estimateMins, hasDeepWorkAlarmPlayed])

  // Alarm for Pomodoro Transitions
  useEffect(() => {
    if (focusModeOption === 'pomodoro' && activeTimeElapsedSeconds > 0) {
      if (cycleSeconds === pomodoroWorkSeconds || cycleSeconds === 0) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3')
          audio.play().catch(() => null)
        } catch (e) {}
      }
    }
  }, [focusModeOption, cycleSeconds, activeTimeElapsedSeconds])

  // Format Helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Define theme colors based on state
  let bgThemeClass = 'bg-brand-500'
  let textThemeClass = 'text-brand-600 dark:text-brand-400'
  let tagThemeClass = 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'

  if (focusState === 'INTERRUPTED') {
    bgThemeClass = 'bg-orange-500'
    tagThemeClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  } else if (focusModeOption === 'deep_work') {
    if (isOvertime) {
      bgThemeClass = 'bg-red-500'
      textThemeClass = 'text-red-500'
      tagThemeClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    } else {
      bgThemeClass = 'bg-indigo-500'
      textThemeClass = 'text-indigo-600 dark:text-indigo-400'
      tagThemeClass = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
    }
  } else if (focusModeOption === 'pomodoro') {
    if (isBreak) {
      bgThemeClass = 'bg-green-500'
      textThemeClass = 'text-green-600 dark:text-green-400'
      tagThemeClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    } else {
      bgThemeClass = 'bg-orange-500'
      textThemeClass = 'text-orange-600 dark:text-orange-400'
      tagThemeClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    }
  }

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-full duration-500 ease-out">
      {/* Dynamic Background overlay */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${bgThemeClass}`}></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Status Indicator */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-8 transition-colors duration-500 ${tagThemeClass}`}>
          {focusState === 'INTERRUPTED' ? 'Afbrudt' : statusText}
        </div>

        {/* Progress Indicator (Checklist Progress or Break view) */}
        {focusState === 'ACTIVE_WORKING' && isBreak && focusModeOption === 'pomodoro' ? (
          <div className="w-full mb-8 flex flex-col items-center text-center animate-in fade-in duration-300">
            <Coffee size={32} className="text-green-500 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-foreground uppercase tracking-widest">Tag en velfortjent pause</span>
            <span className="text-xs text-muted mt-1">Stræk benene eller drik et glas vand</span>
          </div>
        ) : (
          hasChecklist && currentStep && (
            <div className="w-full mb-8 flex flex-col items-center">
              <span className="text-sm font-bold text-muted mb-3 uppercase tracking-widest">
                Trin {firstUncompletedIndex + 1} af {totalCount}
              </span>
              <div className="w-full h-1.5 bg-surface border border-surface-border rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${
                    focusModeOption === 'deep_work' ? 'bg-indigo-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )
        )}

        {/* Task Title / Sequential Step */}
        {isBreak && focusModeOption === 'pomodoro' ? (
          <div className="flex flex-col items-center mb-12 w-full text-center">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 opacity-50">{task.title}</h3>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-foreground">Pause</h2>
          </div>
        ) : hasChecklist && currentStep ? (
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
            <div className={`text-8xl font-black tabular-nums tracking-tighter drop-shadow-lg transition-colors duration-500 ${textThemeClass}`}>
              {isOvertime && '+'}
              {formatTime(activeTimeRemaining)}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-8xl font-black tabular-nums tracking-tighter text-muted opacity-50">
                {isOvertime && '+'}
                {formatTime(activeTimeRemaining)}
              </div>
              <div className="absolute -bottom-8 text-orange-500 font-bold flex items-center gap-2 animate-pulse">
                Leakage: {formatTime(interruptedTimeElapsedSeconds)}
              </div>
            </div>
          )}
        </div>

        {/* Step Completion Button */}
        {hasChecklist && currentStep && focusState === 'ACTIVE_WORKING' && (!isBreak || focusModeOption !== 'pomodoro') && (
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
              <CheckCircle2 size={24} /> Trin fuldført
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full">
          {focusState === 'ACTIVE_WORKING' ? (
            <button 
              onClick={interruptFocus}
              className="w-full bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark border-2 border-surface-border py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-sm"
            >
              <Pause fill="currentColor" /> Afbrudt
            </button>
          ) : (
            <button 
              onClick={resumeFocus}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Play fill="currentColor" /> Genoptag arbejde
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
              <CheckCircle2 size={18} /> Udført
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

