'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, Task } from '@/lib/store'
import { Check, Trash2, Clock, Inbox, ChevronRight, Play, Archive, Link, FastForward, Repeat, FolderKanban, FolderPlus, Calendar, Plus, X } from 'lucide-react'

export function ClarifyWizard() {
  const { tasks, updateTask, deleteTask, addProject, projects } = useStore()
  const inboxTasks = tasks.filter(t => t.status === 'inbox')
  
  const [step, setStep] = useState<'clarify' | 'actionable' | 'project_or_routine'>('clarify')
  const [currentTaskTitle, setCurrentTaskTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Routine local states
  const [isRoutineMode, setIsRoutineMode] = useState(false)
  const [routineInterval, setRoutineInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [routineTimeMode, setRoutineTimeMode] = useState<'exact' | 'window'>('window')
  const [routineTimeOfDay, setRoutineTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [routineExactTime, setRoutineExactTime] = useState<string>('09:00')
  const [routineDayOfWeek, setRoutineDayOfWeek] = useState<number>(1)
  const [routineTimeEstimate, setRoutineTimeEstimate] = useState<string>('30')

  // Event local states
  const [isEventMode, setIsEventMode] = useState(false)
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [eventStartTime, setEventStartTime] = useState<string>('12:00')
  const [eventEndTime, setEventEndTime] = useState<string>('13:00')
  
  // Atomic Checklist state
  const [draftChecklist, setDraftChecklist] = useState<{id: string, text: string, is_completed: boolean}[]>([])
  const [draftChecklistItem, setDraftChecklistItem] = useState('')

  useEffect(() => {
    if (step === 'clarify' && inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
    }
  }, [step])

  const activeTask = inboxTasks[0]

  useEffect(() => {
    // eslint-disable-next-line
    setIsRoutineMode(false)
    setIsEventMode(false)
    setRoutineInterval('daily')
    setRoutineTimeMode('window')
    setRoutineTimeOfDay('morning')
    setRoutineExactTime('09:00')
    setRoutineDayOfWeek(1)
    setRoutineTimeEstimate('30')
    setDraftChecklist([])
    setDraftChecklistItem('')
    setCurrentTaskTitle(activeTask?.title || '')
  }, [activeTask?.id])



  if (!activeTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted mt-20">
        <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Check size={40} className="text-brand-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Inbox Zero</h2>
        <p className="max-w-md text-center">You have successfully processed all incoming items. The thinking is done.</p>
      </div>
    )
  }



  const handleClarifySubmit = () => {
    updateTask(activeTask.id, { title: currentTaskTitle })
    setStep('actionable')
  }

  const handleNonActionable = (action: 'trash' | 'incubate' | 'reference') => {
    if (action === 'trash') {
      deleteTask(activeTask.id)
    } else {
      updateTask(activeTask.id, { status: 'done', context: `[${action.toUpperCase()}]` })
    }
    setStep('clarify')
  }

  const handleActionable = (action: '2min' | 'delegate' | 'defer' | 'project' | 'schedule') => {
    if (action === '2min') {
      // 2 Minute Rule: do it immediately!
      updateTask(activeTask.id, { status: 'done' })
      setStep('clarify')
    } else if (action === 'delegate') {
      updateTask(activeTask.id, { status: 'waiting' })
      setStep('clarify')
    } else if (action === 'schedule') {
      setIsEventMode(true)
      return // Stay on step to fill out form
    } else if (action === 'project') {
      addProject({
        id: crypto.randomUUID(),
        title: activeTask.title,
        outcome: 'Define desired outcome',
        status: 'active'
      })
      deleteTask(activeTask.id)
      setStep('clarify')
    } else {
      setStep('project_or_routine')
    }
  }

  const handleProjectOrRoutine = (projectIdOrAction: string) => {
    if (projectIdOrAction === 'none') {
      updateTask(activeTask.id, { status: 'next_action', title: currentTaskTitle, checklist: draftChecklist })
    } else {
      updateTask(activeTask.id, { status: 'next_action', project_id: projectIdOrAction, title: currentTaskTitle, checklist: draftChecklist })
    }
    setStep('clarify')
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clarify Wizard</h2>
          <p className="text-muted mt-1">Process your inbox one item at a time. No skipping.</p>
        </div>
        <div className="bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
          <Inbox size={18} />
          {inboxTasks.length} remaining
        </div>
      </div>

      <div className="glass rounded-2xl p-8 shadow-xl shadow-brand-500/5 border border-surface-border">
        {step === 'clarify' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold mb-6">1. What is it?</h3>
            <div className="mb-6">
              <label className="text-sm font-medium text-muted mb-2 block">Raw Capture:</label>
              <div className="p-4 bg-surface-hover-light dark:bg-surface-hover-dark rounded-xl border border-surface-border font-mono text-sm opacity-70">
                {activeTask.title}
              </div>
            </div>
            <div className="mb-8">
              <label className="text-sm font-medium text-muted mb-2 block">Clarified Title (Start with a verb):</label>
              <input 
                ref={inputRef}
                type="text" 
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-inner"
                value={currentTaskTitle}
                onChange={(e) => setCurrentTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleClarifySubmit()}
              />
            </div>
            <button 
              onClick={handleClarifySubmit}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20 active:scale-[0.98]"
            >
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 'actionable' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold mb-6">2. Is it actionable?</h3>
            <p className="text-lg font-medium mb-8 p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-100 rounded-xl border border-brand-200 dark:border-brand-800">
              {currentTaskTitle}
            </p>

            {!isEventMode ? (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">No</h4>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleNonActionable('trash')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800 text-left">
                      <Trash2 size={18} /> Trash (Delete)
                    </button>
                    <button onClick={() => handleNonActionable('incubate')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-surface-border text-left">
                      <Clock size={18} /> Incubate (Someday/Maybe)
                    </button>
                    <button onClick={() => handleNonActionable('reference')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-surface-border text-left">
                      <Archive size={18} /> Reference (Save for later)
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Yes</h4>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleActionable('project')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-surface-border text-left">
                      <FolderPlus size={18} /> Convert to Project
                    </button>
                    <button onClick={() => handleActionable('2min')} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800 font-medium text-left">
                      <Play size={18} /> <span className="flex-1">Takes &lt; 2 mins</span> <span className="text-xs uppercase bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded text-green-800 dark:text-green-200 font-bold">Do it now!</span>
                    </button>
                    <button onClick={() => handleActionable('delegate')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-surface-border text-left">
                      <Link size={18} /> Delegate (Waiting For)
                    </button>
                    <button onClick={() => handleActionable('schedule')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-surface-border text-left">
                      <Calendar size={18} /> Schedule (Calendar Event)
                    </button>
                    <button onClick={() => handleActionable('defer')} className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40 transition-colors border border-brand-200 dark:border-brand-800 font-medium text-left">
                      <FastForward size={18} /> Defer (Next Action)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-hover-light dark:bg-surface-hover-dark p-6 rounded-2xl border border-surface-border animate-in fade-in duration-300">
                <h4 className="font-bold text-lg mb-4 text-foreground">Schedule Calendar Event</h4>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Date</label>
                    <input type="date" required className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-muted mb-2 block">Start Time</label>
                      <input type="time" required className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted mb-2 block">End Time</label>
                      <input type="time" required className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsEventMode(false)} className="flex-1 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-semibold py-2.5 px-4 rounded-xl border border-surface-border transition-colors text-sm">Cancel</button>
                  <button onClick={() => {
                    const startMins = Number(eventStartTime.split(':')[0]) * 60 + Number(eventStartTime.split(':')[1]);
                    const endMins = Number(eventEndTime.split(':')[0]) * 60 + Number(eventEndTime.split(':')[1]);
                    let dur = endMins - startMins;
                    if (dur < 0) dur += 24 * 60;

                    updateTask(activeTask.id, {
                      title: currentTaskTitle,
                      status: 'scheduled',
                      type: 'event',
                      event_date: eventDate,
                      event_start_time: eventStartTime,
                      event_end_time: eventEndTime,
                      time_estimate_minutes: dur || 30
                    })
                    setIsEventMode(false)
                    setStep('clarify')
                  }} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">Save Event</button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'project_or_routine' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold mb-6">3. Is it part of a project?</h3>
            <p className="text-lg font-medium mb-8 p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-100 rounded-xl border border-brand-200 dark:border-brand-800">
              {currentTaskTitle}
            </p>

            <div className="mb-8 border border-surface-border rounded-xl p-6 bg-surface-hover-light dark:bg-surface-hover-dark shadow-sm">
              <h4 className="font-bold text-lg mb-2 text-foreground">Add Atomic Steps (Checklist)</h4>
              <p className="text-sm text-muted mb-4">Break this task down into immediate micro-actions. Optional, but strongly encouraged for tasks &gt; 15m.</p>
              
              <div className="flex flex-col gap-2 mb-4">
                {draftChecklist.map(item => (
                  <div key={item.id} className="flex items-center gap-3 group/item bg-background border border-surface-border p-2 rounded-lg shadow-sm">
                    <div className="w-4 h-4 rounded border border-surface-border flex items-center justify-center shrink-0"></div>
                    <span className="text-sm flex-1 text-foreground">{item.text}</span>
                    <button 
                      onClick={() => setDraftChecklist(prev => prev.filter(c => c.id !== item.id))}
                      className="p-1 text-muted hover:text-red-500 transition-opacity opacity-0 group-hover/item:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draftChecklistItem.trim()) return;
                  setDraftChecklist(prev => [...prev, { id: crypto.randomUUID(), text: draftChecklistItem.trim(), is_completed: false }]);
                  setDraftChecklistItem('');
                }} 
                className="flex items-center gap-3"
              >
                <Plus size={16} className="text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Type step and hit Enter..."
                  className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-sm text-foreground placeholder:text-muted"
                  value={draftChecklistItem}
                  onChange={(e) => setDraftChecklistItem(e.target.value)}
                />
              </form>
            </div>

            <div className="flex flex-col gap-3">
              {!isRoutineMode ? (
                <>
                  <button onClick={() => handleProjectOrRoutine('none')} className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-brand-500 hover:shadow-md transition-all text-left bg-background group">
                    <div className="flex items-center gap-3">
                      <Check className="text-muted group-hover:text-brand-500" />
                      <span className="font-medium">No, Standalone Action</span>
                    </div>
                    <span className="text-sm text-muted">Save as single next action</span>
                  </button>
                  
                  <div className="mt-4 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Or add to existing project:</span>
                  </div>

                  {projects.map(p => (
                    <button key={p.id} onClick={() => handleProjectOrRoutine(p.id)} className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-brand-500 hover:shadow-md transition-all text-left bg-background group">
                      <div className="flex items-center gap-3">
                        <FolderKanban className="text-muted group-hover:text-brand-500" />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </button>
                  ))}

                  <div className="mt-4 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Or recurring tasks:</span>
                  </div>

                  <button onClick={() => setIsRoutineMode(true)} className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-brand-500 hover:shadow-md transition-all text-left bg-background group">
                    <div className="flex items-center gap-3">
                      <Repeat className="text-muted group-hover:text-brand-500" />
                      <span className="font-medium">Set up as Routine</span>
                    </div>
                    <span className="text-sm text-muted">Configure as recurring event</span>
                  </button>
                </>
              ) : (
                <div className="bg-surface-hover-light dark:bg-surface-hover-dark p-6 rounded-2xl border border-surface-border animate-in fade-in duration-300">
                  <h4 className="font-bold text-lg mb-4 text-foreground">Configure Routine</h4>
                  
                  <div className="flex flex-col gap-4">
                    {/* Interval Selection */}
                    <div>
                      <label className="text-sm font-semibold text-muted mb-2 block">Interval</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                          <button
                            key={interval}
                            type="button"
                            onClick={() => setRoutineInterval(interval)}
                            className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize transition-all ${
                              routineInterval === interval 
                                ? 'bg-brand-500 border-brand-500 text-white' 
                                : 'bg-background border-surface-border text-foreground hover:bg-surface-border'
                            }`}
                          >
                            {interval}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Day of Week (Only for Weekly) */}
                    {routineInterval === 'weekly' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-semibold text-muted mb-2 block">Day of Week</label>
                        <select
                          className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                          value={routineDayOfWeek}
                          onChange={(e) => setRoutineDayOfWeek(Number(e.target.value))}
                        >
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                          <option value={0}>Sunday</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Time Estimate */}
                      <div>
                        <label className="text-sm font-semibold text-muted mb-2 block">Time Estimate (min)</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                          value={routineTimeEstimate}
                          onChange={(e) => setRoutineTimeEstimate(e.target.value)}
                        />
                      </div>

                      {/* Scheduling */}
                      <div>
                        <label className="text-sm font-semibold text-muted mb-2 block">Time of Day</label>
                        {routineTimeMode === 'window' ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground capitalize"
                              value={routineTimeOfDay}
                              onChange={(e) => setRoutineTimeOfDay(e.target.value as 'morning' | 'afternoon' | 'evening')}
                            >
                              <option value="morning">Morning</option>
                              <option value="afternoon">Afternoon</option>
                              <option value="evening">Evening</option>
                            </select>
                            <button type="button" onClick={() => setRoutineTimeMode('exact')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Exact Time</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              required
                              className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                              value={routineExactTime}
                              onChange={(e) => setRoutineExactTime(e.target.value)}
                            />
                            <button type="button" onClick={() => setRoutineTimeMode('window')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Any Time</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setIsRoutineMode(false)}
                      className="flex-1 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-semibold py-2.5 px-4 rounded-xl border border-surface-border transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        updateTask(activeTask.id, {
                          title: currentTaskTitle,
                          status: 'next_action',
                          type: 'routine',
                          is_routine: true,
                          routine_interval: routineInterval,
                          routine_time_of_day: routineTimeMode === 'window' ? routineTimeOfDay : undefined,
                          routine_exact_time: routineTimeMode === 'exact' ? routineExactTime : undefined,
                          routine_day_of_week: routineInterval === 'weekly' ? routineDayOfWeek : undefined,
                          time_estimate_minutes: Number(routineTimeEstimate) || 30,
                          scheduled_date: new Date().toISOString().split('T')[0]
                        })
                        setIsRoutineMode(false)
                        setStep('clarify')
                      }}
                      className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                    >
                      Save Routine
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
