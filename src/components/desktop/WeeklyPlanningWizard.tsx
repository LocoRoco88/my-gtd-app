'use client'

import { useState } from 'react'
import { useStore, TimeLog, Task } from '@/lib/store'
import { startOfWeek, addDays, format, startOfToday } from 'date-fns'
import { Clock, Repeat, Calendar, CheckCircle2, X } from 'lucide-react'

const PIXELS_PER_MINUTE = 1.2
const START_HOUR = 8
const END_HOUR = 20
const MINUTE_INTERVAL = 10
const SLOTS_PER_HOUR = 60 / MINUTE_INTERVAL
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => i + START_HOUR)

// Helper to format Date ISO to native time input HH:mm
const formatToLocalTime = (isoString?: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// 10-Minute Slot (visual grid)
function TimeSlot({ hour, minutes, isHourMark }: { hour: number; minutes: number; isHourMark: boolean }) {
  return (
    <div 
      className={`absolute w-full ${isHourMark ? 'border-b border-surface-border/50 border-dashed' : ''} pointer-events-none z-0`}
      style={{ 
        top: `${((hour - START_HOUR) * 60 + minutes) * PIXELS_PER_MINUTE}px`, 
        height: `${MINUTE_INTERVAL * PIXELS_PER_MINUTE}px` 
      }}
    >
      {isHourMark && <span className="text-[10px] text-muted/60 absolute -top-2 left-1 bg-surface px-1">{hour}:00</span>}
    </div>
  )
}

function TimeLogBlock({ log, onClick }: { log: TimeLog; onClick: () => void }) {
  const { tasks } = useStore()
  const task = tasks.find(t => t.id === log.task_id)
  
  if (!log.start_time) return null
  
  const startDate = new Date(log.start_time)
  const h = startDate.getHours()
  const m = startDate.getMinutes()
  
  // Calculate duration in minutes (cap to at least 5 mins for visibility)
  const durationMinutes = Math.max(5, Math.ceil(log.duration_seconds / 60))
  
  const topOffset = ((h - START_HOUR) * 60 + m) * PIXELS_PER_MINUTE

  let title = task?.title || 'Unknown Task'
  if (log.checklist_item_id && task?.checklist) {
    const item = task.checklist.find(c => c.id === log.checklist_item_id)
    if (item) title = `${task.title} → ${item.text}`
  }

  return (
    <div
      onClick={onClick}
      className={`absolute left-8 right-2 rounded-lg border border-brand-400 bg-brand-100/90 dark:bg-brand-900/80 dark:border-brand-600 shadow-sm p-1.5 overflow-hidden text-xs z-10 hover:z-20 hover:shadow-md transition-all cursor-pointer hover:border-brand-500`}
      style={{
        top: `${topOffset}px`,
        height: `${durationMinutes * PIXELS_PER_MINUTE}px`
      }}
      title={`${title} (${format(startDate, 'HH:mm')} - ${Math.round(log.duration_seconds / 60)}m)`}
    >
      <div className="font-bold truncate text-foreground leading-tight flex items-center gap-1">
        {log.log_type === 'active' ? <CheckCircle2 size={10} className="text-brand-600" /> : <Clock size={10} className="text-orange-500" />}
        {title}
      </div>
      <div className="text-[9px] text-brand-700/80 dark:text-brand-300/80 mt-0.5">
        {Math.round(log.duration_seconds / 60)}m
      </div>
    </div>
  )
}

function DayColumn({ date, logs, onLogClick }: { date: Date; logs: TimeLog[]; onLogClick: (log: TimeLog) => void }) {
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
    if (routine.routine_interval === 'daily') return true
    if (routine.routine_interval === 'weekly') {
      if (routine.routine_day_of_week !== undefined) return routine.routine_day_of_week === date.getDay()
      const anchorDateStr = routine.scheduled_date
      if (!anchorDateStr) return false
      const [yr, mo, dy] = anchorDateStr.split('-').map(Number)
      return new Date(yr, mo - 1, dy).getDay() === date.getDay()
    }
    if (routine.routine_interval === 'monthly') {
      const anchorDateStr = routine.scheduled_date
      if (!anchorDateStr) return false
      const [yr, mo, dy] = anchorDateStr.split('-').map(Number)
      return new Date(yr, mo - 1, dy).getDate() === date.getDate()
    }
    return false
  })

  const dayEvents = allStoreTasks.filter(t => t.type === 'event' && t.event_date === dateStr)
  
  const trackedMinutes = Math.round(logs.reduce((acc, l) => acc + l.duration_seconds, 0) / 60)

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
          <span>Tracked Time</span>
          <span className="font-medium">{trackedMinutes}m</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative" style={{ height: '600px' }}>
        <div className="relative w-full" style={{ height: `${(END_HOUR - START_HOUR + 1) * 60 * PIXELS_PER_MINUTE}px` }}>
          {HOURS.map(hour => 
            Array.from({ length: SLOTS_PER_HOUR }).map((_, i) => {
              const minutes = i * MINUTE_INTERVAL
              return <TimeSlot key={`${hour}-${minutes}`} hour={hour} minutes={minutes} isHourMark={minutes === 0} />
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
                className="absolute left-8 right-2 rounded-lg border-2 border-dashed border-surface-border bg-surface-hover-light/80 dark:bg-surface-hover-dark/40 opacity-70 p-1.5 flex flex-col justify-between overflow-hidden z-0 shadow-sm pointer-events-none"
                style={{ 
                  top: `${topOffset}px`, 
                  height: `${duration * PIXELS_PER_MINUTE}px` 
                }}
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
                className="absolute left-8 right-2 rounded-lg border-2 border-solid border-purple-400 dark:border-purple-600 bg-purple-100/90 dark:bg-purple-900/50 opacity-90 p-1.5 flex flex-col justify-between overflow-hidden z-0 shadow-sm pointer-events-none"
                style={{ 
                  top: `${topOffset}px`, 
                  height: `${duration * PIXELS_PER_MINUTE}px` 
                }}
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

          {logs.map(log => (
            <TimeLogBlock key={log.id} log={log} onClick={() => onLogClick(log)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function WeeklyPlanningWizard() {
  const { timeLogs, updateTimeLog, deleteTimeLog, tasks, updateTask } = useStore()
  
  // Modal Editing States
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const today = startOfToday()
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }) // Monday start
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))

  const handleLogClick = (log: TimeLog) => {
    const task = tasks.find(t => t.id === log.task_id)
    setEditingLog(log)
    setTaskTitle(task?.title || 'Unknown Task')
    setStartTime(formatToLocalTime(log.start_time))
    setEndTime(formatToLocalTime(log.end_time))
    setErrorMsg('')
  }

  const handleSave = async () => {
    if (!editingLog) return
    
    // Parse times
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      setErrorMsg('Tast venligst gyldige tider.')
      return
    }

    const startDate = new Date(editingLog.start_time)
    startDate.setHours(sh)
    startDate.setMinutes(sm)
    startDate.setSeconds(0)
    startDate.setMilliseconds(0)

    const endDate = new Date(editingLog.end_time || editingLog.start_time)
    endDate.setHours(eh)
    endDate.setMinutes(em)
    endDate.setSeconds(0)
    endDate.setMilliseconds(0)

    if (endDate.getTime() < startDate.getTime()) {
      setErrorMsg('Sluttid kan ikke være før starttid.')
      return
    }

    const durationSeconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000)

    try {
      // 1. Update task title associated with this time log
      if (editingLog.task_id) {
        await updateTask(editingLog.task_id, { title: taskTitle })
      }

      // 2. Update time log details
      await updateTimeLog(editingLog.id, {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_seconds: durationSeconds,
        date: startDate.toISOString().split('T')[0]
      })

      setEditingLog(null)
    } catch (err) {
      console.error(err)
      setErrorMsg('Fejl under gem.')
    }
  }

  const handleDelete = async () => {
    if (!editingLog) return
    if (confirm('Er du sikker på, at du vil slette denne tidslog?')) {
      try {
        await deleteTimeLog(editingLog.id)
        setEditingLog(null)
      } catch (err) {
        console.error(err)
        setErrorMsg('Kunne ikke slette tidslog.')
      }
    }
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full relative">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Historical Logbook</h2>
        <p className="text-muted mt-1">An automated daily diary of where your time went, based on Focus Tracker data.</p>
      </div>

      <div className="flex-1 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          // Filter logs for this specific date
          const dayLogs = timeLogs.filter(l => l.date === dayStr || l.start_time?.startsWith(dayStr))
          return <DayColumn key={dayStr} date={day} logs={dayLogs} onLogClick={handleLogClick} />
        })}
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-foreground">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Ret Tidsregistrering</h3>
              <button 
                onClick={() => setEditingLog(null)}
                className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Opgavetitel</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-background border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Starttid</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-background border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Sluttid</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-background border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 mt-6">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-sm transition-colors border border-transparent hover:border-red-500/20"
                >
                  Slet log
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingLog(null)}
                    className="px-4 py-2.5 bg-surface-hover-light dark:bg-surface-hover-dark border border-surface-border text-foreground hover:bg-surface-border rounded-xl font-bold text-sm transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-500/20"
                  >
                    Gem ændringer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
