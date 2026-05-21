'use client'

import { useStore, Task } from '@/lib/store'
import { Play, Calendar as CalendarIcon } from 'lucide-react'

export function MoleskineView() {
  const { tasks, startFocus } = useStore()
  
  // Get today's actionable tasks (excluding inbox, someday, done)
  const todayTasks = tasks.filter(t => t.status === 'next_action' && t.type !== 'routine')
  
  // Mock calendar events
  const calendarEvents = [
    { id: 'c1', title: 'Team Sync', time: '10:00 AM', isEvent: true },
    { id: 'c2', title: 'Lunch with Sarah', time: '12:30 PM', isEvent: true },
  ]

  // Mix tasks and events for the Moleskine view
  // In a real app, this would be chronologically sorted.
  const mixedItems = [
    calendarEvents[0],
    ...todayTasks.slice(0, 1),
    calendarEvents[1],
    ...todayTasks.slice(1)
  ]

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto font-serif">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Today</h2>
        <div className="h-0.5 w-12 bg-brand-500 mt-2"></div>
      </div>

      {mixedItems.map((item, idx) => {
        if ('isEvent' in item) {
          return (
            <div key={item.id} className="flex gap-4 items-start opacity-70 mb-2">
              <div className="text-xs font-sans font-bold text-muted w-16 pt-1 text-right">{item.time}</div>
              <div className="flex-1 border-l-2 border-surface-border pl-4 pb-4">
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
            <div key={task.id} className="flex gap-4 items-center group mb-2 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark p-4 rounded-2xl border border-surface-border shadow-sm transition-all">
              <div className="w-1.5 h-8 bg-brand-400 rounded-full"></div>
              <div className="flex-1 font-sans">
                <h3 className="font-bold text-base leading-tight">{task.title}</h3>
                {task.context && (
                  <span className="text-xs text-muted font-medium mt-1 inline-block">{task.context}</span>
                )}
              </div>
              <button 
                onClick={() => startFocus(task.id)}
                className="w-10 h-10 rounded-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center transition-transform active:scale-95"
              >
                <Play size={18} fill="currentColor" />
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
    </div>
  )
}
