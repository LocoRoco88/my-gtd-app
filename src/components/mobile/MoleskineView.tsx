'use client'

import { useState } from 'react'
import { useStore, Task } from '@/lib/store'
import { Play, Calendar as CalendarIcon, Dices } from 'lucide-react'
import { TimeBadge } from '@/components/ui/TimeBadge'
import { RandomSprintModal } from '@/components/ui/RandomSprintModal'

export function MoleskineView() {
  const { tasks, startFocus } = useStore()
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false)
  
  // Get today's actionable tasks (excluding inbox, someday, done)
  const todayTasks = tasks.filter(t => t.status === 'next_action' && t.type !== 'routine')
  
  // Get today's date in YYYY-MM-DD format (local timezone)
  const todayStr = new Date().toLocaleDateString('sv-SE')
  
  // Get today's events from the store
  const todayEvents = tasks.filter(t => t.type === 'event' && t.event_date === todayStr)

  // Map store events to the format expected by MoleskineView
  const calendarEvents = todayEvents.map(event => {
    let displayTime = ''
    if (event.event_start_time) {
      const [h, m] = event.event_start_time.split(':')
      const hourNum = parseInt(h, 10)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12
      displayTime = `${displayHour}:${m} ${ampm}`
    }
    return {
      id: event.id,
      title: event.title,
      time: displayTime,
      isEvent: true as const
    }
  })

  // Sort events chronologically by start time
  const sortedEvents = [...calendarEvents].sort((a, b) => {
    const eventA = todayEvents.find(e => e.id === a.id)
    const eventB = todayEvents.find(e => e.id === b.id)
    return (eventA?.event_start_time || '').localeCompare(eventB?.event_start_time || '')
  })

  // Mix tasks and events for the Moleskine view
  const mixedItems = [
    ...sortedEvents,
    ...todayTasks
  ]

  return (
    <div className="flex flex-col gap-3 max-w-sm mx-auto font-serif">
      <div className="mb-3 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Today</h2>
          <div className="h-0.5 w-12 bg-brand-500 mt-2"></div>
        </div>
        <button
          onClick={() => setIsSprintModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-tr from-brand-600 to-indigo-650 text-white rounded-xl text-xs font-sans font-bold shadow active:scale-[0.98] cursor-pointer"
        >
          <Dices size={14} /> Random Sprint
        </button>
      </div>

      {mixedItems.map((item, idx) => {
        if ('isEvent' in item) {
          return (
            <div key={item.id} className="flex gap-3 items-start opacity-70 mb-1">
              <div className="text-xs font-sans font-bold text-muted w-14 pt-1 text-right">{item.time}</div>
              <div className="flex-1 border-l-2 border-surface-border pl-3 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} />
                  <span className="font-sans font-medium line-through decoration-1 text-sm">{item.title}</span>
                </div>
              </div>
            </div>
          )
        } else {
          const task = item as Task
          return (
            <div key={task.id} className="flex gap-3 items-center group mb-2 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark p-3 rounded-2xl border border-surface-border shadow-sm transition-all">
              <div className="w-1.5 h-8 bg-brand-400 rounded-full"></div>
              <div className="flex-1 font-sans">
                <h3 className="font-bold text-sm sm:text-base leading-tight">{task.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {task.context && (
                    <span className="text-xs text-muted font-medium">{task.context}</span>
                  )}
                  <TimeBadge task={task} />
                </div>
              </div>
              <button 
                onClick={() => startFocus(task.id)}
                className="w-9 h-9 rounded-full bg-brand-55 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center transition-transform active:scale-95 shrink-0"
              >
                <Play size={16} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
          )
        }
      })}

      <div className="text-center mt-8 pb-12">
        <div className="inline-block w-2 h-2 rounded-full bg-surface-border mx-1"></div>
        <div className="inline-block w-2 h-2 rounded-full bg-surface-border mx-1"></div>
        <div className="inline-block w-2 h-2 rounded-full bg-surface-border mx-1"></div>
      </div>

      <RandomSprintModal isOpen={isSprintModalOpen} onClose={() => setIsSprintModalOpen(false)} />
    </div>
  )
}
