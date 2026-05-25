'use client'

import { useState } from 'react'
import { useStore, Task } from '@/lib/store'
import { X, Dices, Zap, Check, RefreshCw, Coffee } from 'lucide-react'

interface RandomSprintModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RandomSprintModal({ isOpen, onClose }: RandomSprintModalProps) {
  const { tasks, startFocus } = useStore()
  const [duration, setDuration] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [hasNoMatches, setHasNoMatches] = useState(false)
  const [isRolling, setIsRolling] = useState(false)

  if (!isOpen) return null

  const handleSelectDuration = (mins: number) => {
    setDuration(mins)
    rollTask(mins)
  }

  const rollTask = (mins: number, currentTaskId?: string) => {
    setIsRolling(true)
    setTimeout(() => {
      // Filter next actions with matching time estimate where status = 'next_action' and type = 'standard' and not a routine
      const matching = tasks.filter(
        t => t.status === 'next_action' && t.time_estimate_minutes === mins && t.type === 'standard' && !t.is_routine
      )

      if (matching.length === 0) {
        setSelectedTask(null)
        setHasNoMatches(true)
      } else {
        setHasNoMatches(false)
        const others = currentTaskId ? matching.filter(t => t.id !== currentTaskId) : matching
        const pool = others.length > 0 ? others : matching
        const randomIndex = Math.floor(Math.random() * pool.length)
        setSelectedTask(pool[randomIndex])
      }
      setIsRolling(false)
    }, 600) // micro-animation delay for roulette feel
  }

  const handleChallengeAccepted = () => {
    if (selectedTask) {
      startFocus(selectedTask.id)
      handleClose()
    }
  }

  const handleClose = () => {
    setDuration(null)
    setSelectedTask(null)
    setHasNoMatches(false)
    setIsRolling(false)
    onClose()
  }

  const getMatchingCount = (mins: number) => {
    return tasks.filter(
      t => t.status === 'next_action' && t.time_estimate_minutes === mins && t.type === 'standard' && !t.is_routine
    ).length
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none"></div>
      <div className="absolute w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-white animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-900"
        >
          <X size={18} />
        </button>

        {duration === null ? (
          /* Screen 1: How much time do you have? */
          <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-6">
              <Dices size={32} className="text-white animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black tracking-tight mb-2">Sprint Roulette</h3>
            <p className="text-zinc-450 text-sm mb-8 max-w-xs">
              Beat procrastination by gamifying your next action. How much time do you have?
            </p>

            <div className="flex flex-col gap-3 w-full">
              {[5, 10, 15].map(mins => {
                const count = getMatchingCount(mins)
                return (
                  <button
                    key={mins}
                    onClick={() => handleSelectDuration(mins)}
                    className="w-full flex justify-between items-center px-5 py-4 bg-zinc-900 border border-zinc-800 hover:border-brand-500 hover:bg-zinc-850 rounded-2xl font-bold transition-all active:scale-[0.98] group cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-lg">
                      <Zap size={16} className="text-brand-500 group-hover:animate-bounce" />
                      {mins}m
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full group-hover:bg-zinc-700 transition-colors">
                      {count} {count === 1 ? 'task' : 'tasks'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : isRolling ? (
          /* Roulette Rolling Screen */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw size={48} className="text-brand-500 animate-spin mb-4" />
            <h4 className="text-lg font-bold">Spinning Roulette...</h4>
            <p className="text-xs text-zinc-500 mt-1">Choosing your challenge</p>
          </div>
        ) : hasNoMatches ? (
          /* Screen 3: Empty State */
          <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Coffee size={32} />
            </div>
            
            <h3 className="text-2xl font-black tracking-tight mb-2 text-emerald-400">All Cleared!</h3>
            <p className="text-zinc-400 text-sm mb-8 max-w-xs">
              All short tasks cleared! Take a 5-minute break instead.
            </p>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-sm cursor-pointer"
            >
              Enjoy Break
            </button>
          </div>
        ) : (
          /* Screen 2: Challenge accepted / Roll again */
          selectedTask && (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <span className="text-[10px] uppercase font-black tracking-widest text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 mb-6">
                Active Challenge
              </span>
              
              <h3 className="text-zinc-400 text-sm font-semibold mb-2">Your Next Sprint Challenge:</h3>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-8 leading-tight max-w-xs text-white">
                &ldquo;{selectedTask.title}&rdquo;
              </h2>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleChallengeAccepted}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-500/35 text-base active:scale-[0.98] cursor-pointer"
                >
                  <Check size={18} /> Challenge Accepted
                </button>

                <button
                  onClick={() => rollTask(duration, selectedTask.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all text-sm active:scale-[0.98] cursor-pointer"
                >
                  <RefreshCw size={14} /> Roll Again
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
