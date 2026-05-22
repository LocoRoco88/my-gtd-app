'use client'

import { useState } from 'react'
import { useStore, Task, TimeLog, ChecklistItem } from '@/lib/store'
import { AlertTriangle, ActivitySquare, BarChart3, Clock, Zap, Sunrise, SunMedium, Moon, CheckCircle2, FolderKanban, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { format, isToday, isYesterday, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subMonths, addMonths, isSameMonth, isSameDay } from 'date-fns'

export function ReflectView() {
  const { projects, tasks, timeLogs, dailyReflections, setDailyReflection, setSelectedProjectId, setDesktopTab } = useStore()
  const [activeTab, setActiveTab] = useState<'logbook' | 'review'>('logbook')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [showCelebration, setShowCelebration] = useState(false)

  const getWeeklyCompletedCount = () => {
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
    const endOfThisWeek = endOfWeek(new Date(), { weekStartsOn: 1 })
    return tasks.filter(t => {
      if (t.status !== 'done' || !t.completed_at) return false
      const completedDate = parseISO(t.completed_at)
      return completedDate >= startOfThisWeek && completedDate <= endOfThisWeek
    }).length
  }

  const stagnantProjects = projects.filter(p => {
    if (p.status !== 'active') return false
    const projectTasks = tasks.filter(t => t.project_id === p.id)
    return !projectTasks.some(t => t.status === 'next_action')
  })

  // Mock Analytics Data
  const analytics = {
    coreHours: 32.5,
    routineHours: 10.2,
    leakageMinutes: 145 // Interrupted time
  }

  const totalHours = analytics.coreHours + analytics.routineHours
  const corePercentage = (analytics.coreHours / totalHours) * 100
  const routinePercentage = (analytics.routineHours / totalHours) * 100

  // Logbook Data Processing
  const completedTasks = tasks.filter(t => t.status === 'done' && t.completed_at)
  
  const groupedLogbook = completedTasks.reduce((acc, task) => {
    if (!task.completed_at) return acc
    const dateKey = task.completed_at.split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(task)
    return acc
  }, {} as Record<string, Task[]>)



  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday as first day of week
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    const days = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    // Ensure exactly 42 days (6 weeks) for consistent grid height
    while (days.length < 42) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }

  const getTaskDuration = (taskId: string) => {
    const logs = timeLogs.filter(l => l.task_id === taskId)
    const active = logs.filter(l => l.log_type === 'active').reduce((sum, l) => sum + l.duration_seconds, 0)
    const interrupted = logs.filter(l => l.log_type === 'interrupted').reduce((sum, l) => sum + l.duration_seconds, 0)
    return { active, interrupted }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return null
    const m = Math.round(seconds / 60)
    return `${m}m`
  }

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr)
    if (isToday(d)) return `Today - ${format(d, 'MMM d')}`
    if (isYesterday(d)) return `Yesterday - ${format(d, 'MMM d')}`
    return format(d, 'EEEE, MMM d')
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-10 w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reflect</h2>
          <p className="text-muted mt-1">Audit your system and review your daily logbook.</p>
        </div>
        <div className="flex bg-surface-hover-light dark:bg-surface-hover-dark p-1 rounded-xl border border-surface-border">
          <button 
            onClick={() => setActiveTab('logbook')}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'logbook' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            Daily Logbook
          </button>
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'review' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            Weekly Review
          </button>
        </div>
      </div>

      {activeTab === 'review' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* System Integrity Audit */}
            <div className="glass rounded-2xl p-6 border border-surface-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">System Integrity</h3>
                  <p className="text-sm text-muted">Projects requiring your attention</p>
                </div>
              </div>

              {stagnantProjects.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <div className="inline-block p-3 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 mb-3">
                    <ActivitySquare size={24} />
                  </div>
                  <p className="font-medium text-foreground">All Systems Nominal</p>
                  <p className="text-sm">Every active project has defined next actions.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    {stagnantProjects.length} Stagnant Project{stagnantProjects.length > 1 ? 's' : ''} detected:
                  </div>
                  {stagnantProjects.map(p => (
                    <div key={p.id} className="p-3 bg-background border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between shadow-sm">
                      <span className="font-semibold text-sm">{p.title}</span>
                      <button 
                        onClick={() => {
                          setSelectedProjectId(p.id)
                          setDesktopTab('projects')
                        }}
                        className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                      >
                        Fix Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Focus & Time Analytics */}
            <div className="glass rounded-2xl p-6 border border-surface-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Focus Analytics</h3>
                  <p className="text-sm text-muted">Time allocation this week</p>
                </div>
              </div>

              {/* Time Distribution Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-brand-600 dark:text-brand-400">Core Projects ({analytics.coreHours}h)</span>
                  <span className="text-accent dark:text-accent-dark">Routines ({analytics.routineHours}h)</span>
                </div>
                <div className="h-4 w-full bg-surface-hover-light dark:bg-surface-hover-dark rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${corePercentage}%` }}
                  />
                  <div 
                    className="h-full bg-accent transition-all duration-1000 ease-out" 
                    style={{ width: `${routinePercentage}%` }}
                  />
                </div>
              </div>

              {/* Time Leakage Metric */}
              <div className="p-4 bg-background border border-surface-border rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground">{analytics.leakageMinutes} mins</h4>
                  <p className="text-sm text-muted flex items-center gap-1">
                    <Zap size={14} className="text-orange-500" /> Time Leakage (Interrupted State)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 border border-surface-border text-center flex-1 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-2">Weekly Review Complete?</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">Once you have cleared your inbox, checked your system integrity, and reviewed your calendar, mark your review as complete.</p>
            <button 
              onClick={() => setShowCelebration(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-brand-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              Sign Off Week
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Navigator */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="glass rounded-2xl p-6 border border-surface-border shadow-sm sticky top-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground capitalize">{format(currentMonth, 'MMMM yyyy')}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-muted transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-muted transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs font-bold text-muted">{d}</div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const hasActivity = groupedLogbook[dateStr] !== undefined || dailyReflections[dateStr] !== undefined
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isDayToday = isToday(day)
                  
                  return (
                    <button 
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-full text-sm relative transition-all group
                        ${isSelected ? 'bg-brand-500 text-white shadow-md font-bold' : 'hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'}
                        ${!isCurrentMonth && !isSelected ? 'opacity-30' : ''}
                        ${isDayToday && !isSelected ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}
                      `}
                    >
                      <span>{format(day, 'd')}</span>
                      {hasActivity && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-brand-500'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-6 flex justify-center">
                 <button 
                   onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()); }} 
                   className="text-xs font-bold uppercase tracking-wider text-muted hover:text-brand-600 transition-colors"
                 >
                   Go to Today
                 </button>
              </div>
            </div>
          </div>

          {/* Right Column: The Feed */}
          <div className="col-span-1 md:col-span-2">
            {(() => {
              const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
              const dayTasks = groupedLogbook[selectedDateStr]?.sort((a, b) => a.completed_at!.localeCompare(b.completed_at!)) || []
              const dayReflection = dailyReflections[selectedDateStr] || ''
              const hasActivity = dayTasks.length > 0 || dayReflection.length > 0

              if (!hasActivity) {
                return (
                  <div className="glass rounded-2xl p-12 border border-surface-border text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4 text-brand-500 opacity-50">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No activity logged</h3>
                    <p className="text-muted">You have no completed tasks or reflections for {getDateLabel(selectedDateStr)}.</p>
                  </div>
                )
              }

              return (
                <div className="relative">
                  {/* Date Header */}
                  <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <div className="h-px bg-surface-border flex-1"></div>
                    <span className="uppercase tracking-widest text-muted">{getDateLabel(selectedDateStr)}</span>
                    <div className="h-px bg-surface-border flex-1"></div>
                  </h3>

                  {/* Timeline */}
                  {dayTasks.length > 0 && (
                    <div className="pl-6 space-y-6 relative border-l-2 border-surface-border/50 ml-4 mb-8">
                      {dayTasks.map(task => {
                        const { active, interrupted } = getTaskDuration(task.id)
                        const timeString = formatDuration(active)
                        const hasHighLeakage = interrupted > 300 // 5 minutes
                        
                        const cl = task.checklist || []
                        const totalSteps = cl.length
                        const completedSteps = cl.filter(c => c.is_completed).length

                        return (
                          <div key={task.id} className="relative">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand-500 ring-4 ring-background"></div>
                            
                            <div className="glass rounded-2xl p-5 border border-surface-border shadow-sm flex items-start gap-4 hover:border-brand-500/50 transition-colors">
                              {/* Icon */}
                              <div className="mt-1 shrink-0 text-muted">
                                {task.type === 'routine' ? (
                                  task.routine_time_of_day === 'morning' ? <Sunrise size={20} className="text-orange-500" /> :
                                  task.routine_time_of_day === 'afternoon' ? <SunMedium size={20} className="text-amber-500" /> :
                                  <Moon size={20} className="text-indigo-500" />
                                ) : (
                                  <CheckCircle2 size={20} className="text-green-500" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="font-bold text-lg text-foreground leading-snug">{task.title}</h4>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm font-medium">
                                      {/* Checklist Meta */}
                                      {totalSteps > 0 && (
                                        <span className="text-brand-600 dark:text-brand-400">
                                          {completedSteps === totalSteps ? `All ${totalSteps} steps completed!` : `${completedSteps}/${totalSteps} steps completed`}
                                        </span>
                                      )}
                                      
                                      {/* Project Badge */}
                                      {task.project_id && (
                                        <span className="flex items-center gap-1 text-muted">
                                          <FolderKanban size={14} />
                                          {projects.find(p => p.id === task.project_id)?.title || 'Unknown Project'}
                                        </span>
                                      )}
                                      
                                      {/* Duration Meta */}
                                      {timeString && (
                                        <span className="flex items-center gap-1 text-muted">
                                          <Clock size={14} /> {timeString} Focus
                                        </span>
                                      )}

                                      {/* Leakage Meta */}
                                      {hasHighLeakage && (
                                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded text-xs">
                                          <Zap size={12} /> High Interruption ({formatDuration(interrupted)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-muted uppercase tracking-widest whitespace-nowrap opacity-60 mt-1">
                                    {format(parseISO(task.completed_at!), 'HH:mm')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Manual Reflection Input */}
                  <div className="px-4 border-t border-surface-border pt-6 mt-6">
                    <input 
                      type="text"
                      className="w-full bg-transparent border-none text-foreground placeholder:text-muted/40 focus:outline-none text-xl font-serif italic py-4 transition-colors focus:placeholder:text-muted/20"
                      placeholder="Dagens tanke / Reflection..."
                      value={dailyReflections[selectedDateStr] || ''}
                      onChange={(e) => setDailyReflection(selectedDateStr, e.target.value)}
                    />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background/85 dark:bg-surface/85 border border-surface-border p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner animate-bounce">
              🎉
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Weekly Review Complete!</h3>
            <p className="text-muted mb-6 text-sm">
              Incredible job organizing your system. You completed <span className="font-bold text-brand-600 dark:text-brand-400 text-lg">{getWeeklyCompletedCount()}</span> task{getWeeklyCompletedCount() === 1 ? '' : 's'} this week!
            </p>
            <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900 rounded-xl p-4 mb-6 w-full text-xs text-brand-800 dark:text-brand-300 font-medium">
              &ldquo;Your mind is for having ideas, not holding them.&rdquo; — David Allen
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-[0.98] cursor-pointer"
            >
              Hooray!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
