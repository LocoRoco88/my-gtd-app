'use client'

import { useStore, Task } from '@/lib/store'
import { Play, Repeat, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export function TimelineView() {
  const { tasks, startFocus } = useStore()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const currentTimeRef = useRef<HTMLDivElement>(null)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (currentTimeRef.current) {
      // Scroll the current time line into the center of the scrollable area
      currentTimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const todayTasks = tasks.filter(t => t.status === 'next_action')
  
  // Parse actual events for today
  const dateStr = currentTime.toISOString().split('T')[0]
  const todayEvents = tasks.filter(t => t.type === 'event' && t.event_date === dateStr)

  const eventBlocks = todayEvents.map(event => {
    let startH = 12
    if (event.event_start_time) {
      const [h, m] = event.event_start_time.split(':').map(Number)
      startH = h + (m / 60)
    }
    return {
      startHour: startH,
      durationMinutes: event.time_estimate_minutes || 60,
      task: event,
      isRoutine: false,
      isEvent: true
    }
  })

  // Create an artificial schedule mapping tasks to specific times for demonstration, merged with real events
  const scheduledBlocks = [
    { startHour: 8, durationMinutes: 60, task: todayTasks.find(t => t.title.includes('Workout')), isRoutine: true, isEvent: false },
    { startHour: 9.5, durationMinutes: 90, task: todayTasks.find(t => t.type === 'standard') || todayTasks[0], isRoutine: false, isEvent: false },
    { startHour: 13, durationMinutes: 45, task: todayTasks[1] || null, isRoutine: false, isEvent: false },
    ...eventBlocks
  ]

  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // Height per hour in pixels
  const hourHeight = 80

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTimePosition = (currentHour + currentMinute / 60) * hourHeight

  return (
    <div className="max-w-sm mx-auto font-sans relative">
      <div className="relative" style={{ height: `${24 * hourHeight}px` }}>
        {/* Vertical Line */}
        <div className="absolute left-14 top-0 bottom-0 w-px bg-surface-border z-0"></div>

        {/* Current Time Indicator */}
        <div 
          ref={currentTimeRef}
          className="absolute left-14 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: `${currentTimePosition}px`, transform: 'translateY(-50%)' }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 -ml-[5px]"></div>
          <div className="flex-1 h-[2px] bg-red-500/50"></div>
          <div className="absolute right-0 text-[10px] font-bold text-red-500 bg-background px-1 rounded">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Hour markers */}
        {hours.map(hour => (
          <div 
            key={hour} 
            className="absolute left-0 w-full flex"
            style={{ top: `${hour * hourHeight}px` }}
          >
            <div className="w-14 text-right pr-4 text-xs font-bold text-muted bg-background relative z-10 -translate-y-1/2">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 border-t border-surface-border opacity-50 relative z-0"></div>
          </div>
        ))}

        {/* Scheduled Blocks */}
        <div className="absolute left-14 right-0 top-0 bottom-0 z-10 ml-4 mr-2">
          {scheduledBlocks.map((block, i) => {
            if (!block.task) return null;
            return (
              <div 
                key={i}
                className={`absolute left-0 right-0 rounded-2xl p-4 flex flex-col justify-between border transition-all shadow-sm ${
                  block.isEvent
                    ? 'bg-purple-100/90 border-purple-300 dark:bg-purple-900/30 dark:border-purple-800'
                    : block.isRoutine 
                      ? 'bg-accent/10 border-accent/20 text-accent-dark' 
                      : 'bg-brand-50 dark:bg-brand-900/40 border-brand-200 dark:border-brand-800'
                }`}
                style={{ 
                  top: `${block.startHour * hourHeight}px`, 
                  height: `${(block.durationMinutes / 60) * hourHeight}px` 
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden pr-2">
                    <h4 className={`font-bold leading-tight truncate ${block.isRoutine ? '' : block.isEvent ? 'text-purple-900 dark:text-purple-100' : 'text-brand-900 dark:text-brand-100'}`}>
                      {block.task.title}
                    </h4>
                    {block.isRoutine && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold mt-1 opacity-70">
                        <Repeat size={10} /> Routine
                      </span>
                    )}
                    {block.isEvent && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold mt-1 opacity-70 text-purple-700 dark:text-purple-300">
                        <Calendar size={10} /> Calendar Event
                      </span>
                    )}
                  </div>
                  {!block.isEvent && (
                    <button 
                      onClick={() => startFocus(block.task!.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
                        block.isRoutine
                          ? 'bg-accent/20 text-accent-dark hover:bg-accent/30'
                          : 'bg-brand-500 text-white shadow-md shadow-brand-500/20 hover:bg-brand-600'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className={block.isRoutine ? '' : 'ml-0.5'} />
                    </button>
                  )}
                </div>
                <div className="text-xs font-medium opacity-60">
                  {Math.floor(block.startHour).toString().padStart(2, '0')}:{((block.startHour % 1) * 60).toString().padStart(2, '0')} • {block.durationMinutes} min
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
