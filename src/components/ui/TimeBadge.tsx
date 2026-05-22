'use client'

import { useState } from 'react'
import { Task } from '@/lib/store'
import { Clock, Sparkles } from 'lucide-react'
import { MagicWandModal } from './MagicWandModal'

interface TimeBadgeProps {
  task: Task
  className?: string
}

export function TimeBadge({ task, className = '' }: TimeBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const estimate = task.time_estimate_minutes
  if (!estimate) return null

  const isRoutine = task.is_routine || task.type === 'routine'
  const isDeepWork = estimate > 60

  let badgeStyles = ''
  if (isRoutine) {
    badgeStyles = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  } else if (isDeepWork) {
    badgeStyles = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
  } else {
    badgeStyles = 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-900/60'
  }

  const showWand = estimate > 30 && !isRoutine

  return (
    <>
      <span 
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${badgeStyles} ${className} shrink-0 select-none`}
      >
        <Clock size={11} />
        <span>{estimate}m</span>
        
        {showWand && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            title="Generer mikro-trin med AI"
            className="ml-1 p-0.5 -mr-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors animate-pulse"
          >
            <Sparkles size={11} />
          </button>
        )}
      </span>

      {showWand && (
        <MagicWandModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          taskTitle={task.title}
          timeEstimate={estimate}
        />
      )}
    </>
  )
}
