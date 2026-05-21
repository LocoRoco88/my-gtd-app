'use client'

import { useState } from 'react'
import { useStore, Task } from '@/lib/store'
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, closestCenter, DragOverlay } from '@dnd-kit/core'
import { startOfWeek, addDays, format, isBefore, startOfToday } from 'date-fns'
import { Clock, GripVertical, Sparkles, AlertCircle, Repeat, Calendar, ListChecks } from 'lucide-react'

// Draggable Task Item
function DraggableTask({ task, onAIBreakdown }: { task: Task; onAIBreakdown?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: task
  })

  const needsBreakdown = (task.time_estimate_minutes || 0) > 30
  const checklist = task.checklist || []
  const completedCount = checklist.filter(c => c.is_completed).length

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-xl border mb-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-lg scale-105' : 'bg-surface border-surface-border shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={16} className="text-muted mt-0.5 cursor-grab" />
        <div className="flex-1">
          <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
          <div className="flex items-center gap-3 mt-2">
            {task.time_estimate_minutes && (
              <span className={`text-xs flex items-center gap-1 ${needsBreakdown ? 'text-red-500 font-bold' : 'text-muted'}`}>
                <Clock size={12} /> {task.time_estimate_minutes}m
              </span>
            )}
            {task.context && (
              <span className="text-xs text-muted bg-surface-border px-1.5 py-0.5 rounded-md">
                {task.context}
              </span>
            )}
            {checklist.length > 0 && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${completedCount === checklist.length ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-muted bg-surface-border'}`}>
                <ListChecks size={10} /> {completedCount}/{checklist.length}
              </span>
            )}
          </div>
          
          {needsBreakdown && onAIBreakdown && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
              onClick={() => onAIBreakdown(task.id)}
              className="mt-3 w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Sparkles size={12} /> AI Breakdown (&gt;30m)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const PIXELS_PER_MINUTE = 1.2
const START_HOUR = 8
const END_HOUR = 20
const MINUTE_INTERVAL = 10
const SLOTS_PER_HOUR = 60 / MINUTE_INTERVAL
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => i + START_HOUR)

// 10-Minute Droppable Slot
function TimeSlot({ dateStr, hour, minutes, isHourMark }: { dateStr: string; hour: number; minutes: number; isHourMark: boolean }) {
  const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const { setNodeRef, isOver } = useDroppable({
    id: `${dateStr}T${timeStr}`
  })
  
  return (
    <div 
      ref={setNodeRef}
      className={`absolute w-full transition-colors ${isOver ? 'bg-brand-500/20 z-30' : 'z-0'} ${isHourMark ? 'border-b border-surface-border/50 border-dashed' : ''}`}
      style={{ 
        top: `${((hour - START_HOUR) * 60 + minutes) * PIXELS_PER_MINUTE}px`, 
        height: `${MINUTE_INTERVAL * PIXELS_PER_MINUTE}px` 
      }}
    >
      {isHourMark && <span className="text-[10px] text-muted/60 absolute -top-2 left-1 bg-surface px-1">{hour}:00</span>}
    </div>
  )
}

// Scheduled Task Block
function ScheduledTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: task
  })

  const duration = task.time_estimate_minutes || 30
  const checklist = task.checklist || []
  const completedCount = checklist.filter(c => c.is_completed).length
  let topOffset = 0
  if (task.start_time) {
    const [h, m] = task.start_time.split(':').map(Number)
    topOffset = ((h - START_HOUR) * 60 + m) * PIXELS_PER_MINUTE
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute left-8 right-2 rounded-lg border border-brand-400 bg-brand-100 dark:bg-brand-900/60 dark:border-brand-600 shadow-sm p-1.5 overflow-hidden cursor-grab active:cursor-grabbing text-xs transition-all ${
        isDragging ? 'opacity-50 z-50 scale-105' : 'z-10 hover:z-20 hover:shadow-md'
      }`}
      style={{
        top: `${topOffset}px`,
        height: `${duration * PIXELS_PER_MINUTE}px`
      }}
    >
      <div className="font-bold truncate text-foreground leading-tight">{task.title}</div>
      <div className="text-[9px] text-muted mt-0.5 flex items-center gap-1 flex-wrap">
        <span className="flex items-center gap-0.5"><Clock size={8} /> {duration}m</span>
        {checklist.length > 0 && (
          <span className={`flex items-center gap-0.5 ml-1 ${completedCount === checklist.length ? 'text-green-600' : 'text-brand-700 dark:text-brand-300'}`}>
            <ListChecks size={8} /> {completedCount}/{checklist.length}
          </span>
        )}
      </div>
    </div>
  )
}

// Droppable Day Column (Timeline)
function DayColumn({ date, tasks }: { date: Date; tasks: Task[] }) {
  const { workSchedule, tasks: allStoreTasks } = useStore()
  const dateStr = format(date, 'yyyy-MM-dd')
  const isToday = dateStr === format(startOfToday(), 'yyyy-MM-dd')

  const getTimeOfDayHour = (timeOfDay?: 'morning' | 'afternoon' | 'evening') => {
    if (timeOfDay === 'afternoon') return 13
    if (timeOfDay === 'evening') return 18
    return 9 // morning default
  }

  // Filter routines that apply to this day
  const dayRoutines = allStoreTasks.filter(t => t.is_routine || t.type === 'routine').filter(routine => {
    if (routine.routine_interval === 'daily') {
      return true
    }
    
    if (routine.routine_interval === 'weekly') {
      if (routine.routine_day_of_week !== undefined) {
        return routine.routine_day_of_week === date.getDay()
      }
      // fallback to anchor date if routine_day_of_week is missing
      const anchorDateStr = routine.scheduled_date
      if (!anchorDateStr) return false
      const [yr, mo, dy] = anchorDateStr.split('-').map(Number)
      const anchorDate = new Date(yr, mo - 1, dy)
      return anchorDate.getDay() === date.getDay()
    }
    
    if (routine.routine_interval === 'monthly') {
      const anchorDateStr = routine.scheduled_date
      if (!anchorDateStr) return false
      const [yr, mo, dy] = anchorDateStr.split('-').map(Number)
      const anchorDate = new Date(yr, mo - 1, dy)
      return anchorDate.getDate() === date.getDate()
    }
    
    return false
  })

  const scheduledMinutes = tasks.reduce((acc, t) => acc + (t.time_estimate_minutes || 0), 0)
  const routineMinutes = dayRoutines.reduce((acc, r) => acc + (r.time_estimate_minutes || 0), 0)
  const dayEvents = allStoreTasks.filter(t => t.type === 'event' && t.event_date === dateStr)
  const eventMinutes = dayEvents.reduce((acc, e) => acc + (e.time_estimate_minutes || 0), 0)
  const totalMinutes = scheduledMinutes + routineMinutes + eventMinutes

  const dayIndex = date.getDay()
  const schedule = workSchedule[dayIndex]
  const isWorkDay = schedule?.isActive
  
  let workStartOffset = 0
  let workDuration = 0
  
  if (isWorkDay && schedule?.startHour && schedule?.endHour) {
    const [startH, startM] = schedule.startHour.split(':').map(Number)
    const [endH, endM] = schedule.endHour.split(':').map(Number)
    
    const startMins = (startH - START_HOUR) * 60 + startM
    const endMins = (endH - START_HOUR) * 60 + endM
    
    // Only render if within the timeline bounds
    if (endMins > 0 && startMins < (END_HOUR - START_HOUR + 1) * 60) {
      workStartOffset = Math.max(0, startMins) * PIXELS_PER_MINUTE
      const actualEndMins = Math.min((END_HOUR - START_HOUR + 1) * 60, endMins)
      workDuration = (actualEndMins - Math.max(0, startMins)) * PIXELS_PER_MINUTE
    }
  }

  return (
    <div className={`flex-1 flex flex-col min-w-[160px] rounded-2xl border transition-colors bg-surface/50 border-surface-border ${isToday ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-background' : ''}`}>
      <div className={`p-3 border-b border-surface-border rounded-t-2xl z-20 sticky top-0 ${isToday ? 'bg-brand-500 text-white' : 'bg-surface'}`}>
        <h3 className="font-bold text-sm">{format(date, 'EEEE')}</h3>
        <p className={`text-xs mt-0.5 ${isToday ? 'text-brand-100' : 'text-muted'}`}>{format(date, 'MMM d')}</p>
        <div className="mt-3 pt-2 border-t border-current/20 flex justify-between items-center text-xs">
          <span>Scheduled</span>
          <span className="font-medium">{totalMinutes}m</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative" style={{ height: '600px' }}>
        <div className="relative w-full" style={{ height: `${(END_HOUR - START_HOUR + 1) * 60 * PIXELS_PER_MINUTE}px` }}>
          {HOURS.map(hour => 
            Array.from({ length: SLOTS_PER_HOUR }).map((_, i) => {
              const minutes = i * MINUTE_INTERVAL
              return <TimeSlot key={`${hour}-${minutes}`} dateStr={dateStr} hour={hour} minutes={minutes} isHourMark={minutes === 0} />
            })
          )}
          
          {/* Work Block Pattern */}
          {workDuration > 0 && (
            <div 
              className="absolute left-0 right-0 z-0 opacity-50 pointer-events-none"
              style={{ 
                top: `${workStartOffset}px`, 
                height: `${workDuration}px`,
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, var(--surface-border) 10px, var(--surface-border) 20px)`
              }}
            >
              <div className="absolute top-2 left-8 bg-surface/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-muted border border-surface-border">
                WORK HOURS
              </div>
            </div>
          )}
          
          {/* Automatically Render Saved Routines */}
          {dayRoutines.map(routine => {
            let startH = 9
            let startM = 0
            if (routine.routine_exact_time) {
              const [h, m] = routine.routine_exact_time.split(':').map(Number)
              startH = h
              startM = m
            } else {
              startH = getTimeOfDayHour(routine.routine_time_of_day)
            }
            
            const duration = routine.time_estimate_minutes || 30
            const topOffset = ((startH - START_HOUR) * 60 + startM) * PIXELS_PER_MINUTE
            
            return (
              <div 
                key={`routine-${routine.id}`}
                className="absolute left-8 right-2 rounded-lg border-2 border-dashed border-surface-border bg-surface-hover-light/80 dark:bg-surface-hover-dark/40 opacity-70 p-1.5 flex flex-col justify-between overflow-hidden z-0 shadow-sm"
                style={{ 
                  top: `${topOffset}px`, 
                  height: `${duration * PIXELS_PER_MINUTE}px` 
                }}
                title={`${routine.title} (${routine.routine_interval} routine, locked)`}
              >
                <div>
                  <div className="font-bold truncate text-muted text-[10px] leading-tight flex items-center gap-1">
                    <Repeat size={10} className="shrink-0 text-brand-500" />
                    {routine.title}
                  </div>
                </div>
                <div className="text-[9px] text-muted/80 mt-0.5 flex items-center justify-between">
                  <span>{duration}m</span>
                  <span className="capitalize">{routine.routine_exact_time || routine.routine_time_of_day}</span>
                </div>
              </div>
            )
          })}

          {/* Automatically Render Saved Events */}
          {dayEvents.map(event => {
            let startH = 12
            let startM = 0
            if (event.event_start_time) {
              const [h, m] = event.event_start_time.split(':').map(Number)
              startH = h
              startM = m
            }
            
            const duration = event.time_estimate_minutes || 60
            const topOffset = ((startH - START_HOUR) * 60 + startM) * PIXELS_PER_MINUTE
            
            return (
              <div 
                key={`event-${event.id}`}
                className="absolute left-8 right-2 rounded-lg border-2 border-solid border-purple-400 dark:border-purple-600 bg-purple-100/90 dark:bg-purple-900/50 opacity-90 p-1.5 flex flex-col justify-between overflow-hidden z-0 shadow-sm"
                style={{ 
                  top: `${topOffset}px`, 
                  height: `${duration * PIXELS_PER_MINUTE}px` 
                }}
                title={`${event.title} (Calendar Event)`}
              >
                <div>
                  <div className="font-bold truncate text-purple-900 dark:text-purple-100 text-[10px] leading-tight flex items-center gap-1">
                    <Calendar size={10} className="shrink-0" />
                    {event.title}
                  </div>
                </div>
                <div className="text-[9px] text-purple-800/80 dark:text-purple-200/80 mt-0.5 flex items-center justify-between">
                  <span>{duration}m</span>
                  <span>{event.event_start_time} - {event.event_end_time}</span>
                </div>
              </div>
            )
          })}

          {tasks.map(task => (
            <ScheduledTask key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function WeeklyPlanningWizard() {
  const { tasks, updateTask, addTask, deleteTask } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const today = startOfToday()
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }) // Monday start
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask((e.active.data.current as Task) ?? null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return

    const overId = String(over.id)
    if (overId.includes('T')) {
      const [dateStr, timeStr] = overId.split('T')
      const taskId = String(active.id).replace('scheduled-', '')
      const taskToMove = tasks.find(t => t.id === taskId)
      
      if (!taskToMove) return

      // Overlap check
      const [dropH, dropM] = timeStr.split(':').map(Number)
      const dropStartMins = dropH * 60 + dropM
      const duration = taskToMove.time_estimate_minutes || 30
      const dropEndMins = dropStartMins + duration
      
      const dayTasks = tasks.filter(t => t.status === 'scheduled' && t.scheduled_date === dateStr && t.id !== taskId)
      const hasOverlap = dayTasks.some(t => {
        if (!t.start_time) return false
        const [tH, tM] = t.start_time.split(':').map(Number)
        const tStartMins = tH * 60 + tM
        const tEndMins = tStartMins + (t.time_estimate_minutes || 30)
        
        return dropStartMins < tEndMins && dropEndMins > tStartMins
      })

      if (hasOverlap) {
        alert("This time block overlaps with an existing task!")
        return
      }

      updateTask(taskId, {
        status: 'scheduled',
        scheduled_date: dateStr,
        start_time: timeStr
      })
    }
  }

  const handleAIBreakdown = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || !task.time_estimate_minutes) return
    
    // Mock AI Breakdown logic
    const halfTime = Math.floor(task.time_estimate_minutes / 2)
    const part1 = { 
      ...task, 
      id: crypto.randomUUID(), 
      title: `${task.title} (Part 1)`, 
      time_estimate_minutes: halfTime 
    }
    const part2 = { 
      ...task, 
      id: crypto.randomUUID(), 
      title: `${task.title} (Part 2)`, 
      time_estimate_minutes: task.time_estimate_minutes - halfTime 
    }
    
    deleteTask(task.id)
    addTask(part1)
    addTask(part2)
  }

  const unscheduledTasks = tasks.filter(t => t.status === 'next_action' && !t.is_routine && t.type === 'standard')
  
  // Also highlight tasks that were scheduled in the past but not done (Rollover)
  const rolloverTasks = tasks.filter(t => 
    t.status === 'scheduled' && 
    t.scheduled_date && 
    isBefore(new Date(t.scheduled_date), today) &&
    t.type === 'standard'
  )

  const poolTasks = [...unscheduledTasks, ...rolloverTasks]

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Weekly Planning</h2>
        <p className="text-muted text-sm mt-1">Drag next actions onto the calendar to block time for execution.</p>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Action Pool (Left Side) */}
          <div className="w-80 flex flex-col bg-surface/50 border border-surface-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-border bg-surface">
              <h3 className="font-bold">Action Pool</h3>
              <p className="text-xs text-muted mt-1">{poolTasks.length} unscheduled tasks</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {rolloverTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Rollover (Past Due)</h4>
                  {rolloverTasks.map(task => (
                    <DraggableTask key={task.id} task={task} onAIBreakdown={handleAIBreakdown} />
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Unscheduled</h4>
                {unscheduledTasks.map(task => (
                  <DraggableTask key={task.id} task={task} onAIBreakdown={handleAIBreakdown} />
                ))}
                {unscheduledTasks.length === 0 && (
                  <div className="text-center p-8 text-muted border-2 border-dashed border-surface-border rounded-xl">
                    <p className="text-sm">Action pool is empty.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Calendar Grid (Right Side) */}
          <div className="flex-1 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayTasks = tasks.filter(t => t.status === 'scheduled' && t.scheduled_date === dayStr)
              return <DayColumn key={dayStr} date={day} tasks={dayTasks} />
            })}
          </div>

        </div>

        {/* Drag Overlay for smooth dragging visual */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 scale-105 pointer-events-none">
              <DraggableTask task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
