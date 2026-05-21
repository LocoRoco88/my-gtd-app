'use client'

import { useState } from 'react'
import { useStore, Task, RoutineInterval, RoutineTimeOfDay } from '@/lib/store'
import { Plus, Repeat, Clock, Trash2, Edit2, Check, AlertCircle } from 'lucide-react'

export function RoutineDashboard() {
  const { tasks, addTask, updateTask, deleteTask } = useStore()
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  
  // Create state
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newInterval, setNewInterval] = useState<RoutineInterval>('daily')
  const [newTimeMode, setNewTimeMode] = useState<'exact' | 'window'>('window')
  const [newTimeOfDay, setNewTimeOfDay] = useState<RoutineTimeOfDay>('morning')
  const [newExactTime, setNewExactTime] = useState('09:00')
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1)
  const [newEstimate, setNewEstimate] = useState('30')

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editInterval, setEditInterval] = useState<RoutineInterval>('daily')
  const [editTimeMode, setEditTimeMode] = useState<'exact' | 'window'>('window')
  const [editTimeOfDay, setEditTimeOfDay] = useState<RoutineTimeOfDay>('morning')
  const [editExactTime, setEditExactTime] = useState('09:00')
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(1)
  const [editEstimate, setEditEstimate] = useState('30')

  const routines = tasks.filter(t => t.is_routine || t.type === 'routine')
  const selectedRoutine = routines.find(r => r.id === selectedRoutineId)

  const handleStartCreate = () => {
    setNewTitle('')
    setNewInterval('daily')
    setNewTimeMode('window')
    setNewTimeOfDay('morning')
    setNewExactTime('09:00')
    setNewDayOfWeek(1)
    setNewEstimate('30')
    setIsCreating(true)
  }
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    addTask({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      status: 'next_action',
      type: 'routine',
      is_routine: true,
      routine_interval: newInterval,
      routine_time_of_day: newTimeMode === 'window' ? newTimeOfDay : undefined,
      routine_exact_time: newTimeMode === 'exact' ? newExactTime : undefined,
      routine_day_of_week: newInterval === 'weekly' ? newDayOfWeek : undefined,
      time_estimate_minutes: Number(newEstimate) || 30,
      context: null,
      scheduled_date: new Date().toISOString().split('T')[0]
    })

    setIsCreating(false)
  }

  const handleStartEdit = () => {
    if (!selectedRoutine) return
    setEditTitle(selectedRoutine.title)
    setEditInterval(selectedRoutine.routine_interval || 'daily')
    setEditTimeMode(selectedRoutine.routine_exact_time ? 'exact' : 'window')
    setEditTimeOfDay(selectedRoutine.routine_time_of_day || 'morning')
    setEditExactTime(selectedRoutine.routine_exact_time || '09:00')
    setEditDayOfWeek(selectedRoutine.routine_day_of_week ?? 1)
    setEditEstimate(String(selectedRoutine.time_estimate_minutes || 30))
    setIsEditing(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoutine || !editTitle.trim()) return

    updateTask(selectedRoutine.id, {
      title: editTitle.trim(),
      routine_interval: editInterval,
      routine_time_of_day: editTimeMode === 'window' ? editTimeOfDay : undefined,
      routine_exact_time: editTimeMode === 'exact' ? editExactTime : undefined,
      routine_day_of_week: editInterval === 'weekly' ? editDayOfWeek : undefined,
      time_estimate_minutes: Number(editEstimate) || 30
    })

    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!selectedRoutineId) return
    deleteTask(selectedRoutineId)
    setSelectedRoutineId(null)
    setIsEditing(false)
  }

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Recurring Routines</h2>
          <p className="text-muted mt-1">Manage templates that automatically block calendar capacity.</p>
        </div>
        <button 
          onClick={handleStartCreate}
          className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} /> New Routine
        </button>
      </div>

      <div className="flex gap-6 h-full overflow-hidden pb-10">
        {/* Left column: Routine list */}
        <div className="w-1/3 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10">
          {routines.length === 0 ? (
            <div className="text-center p-8 bg-surface/30 rounded-xl border border-surface-border text-muted italic">
              No routines defined yet.
            </div>
          ) : (
            routines.map(routine => {
              const isSelected = selectedRoutineId === routine.id

              return (
                <button
                  key={routine.id}
                  onClick={() => {
                    setSelectedRoutineId(routine.id)
                    setIsEditing(false)
                    setIsCreating(false)
                  }}
                  className={`relative flex flex-col text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 shadow-md' 
                      : 'bg-surface hover:border-brand-300 border-surface-border'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Repeat size={18} className="text-brand-500" />
                      <h3 className="font-bold text-foreground">{routine.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                      {routine.routine_interval}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {routine.time_estimate_minutes} mins
                    </span>
                    <span className="capitalize">
                      • {routine.routine_exact_time || routine.routine_time_of_day}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Right column: Form or details card */}
        <div className="flex-1 glass rounded-2xl border border-surface-border p-6 overflow-y-auto no-scrollbar relative min-h-[400px]">
          {isCreating ? (
            <form onSubmit={handleCreate} className="animate-in fade-in duration-300 flex flex-col gap-6">
              <h3 className="text-xl font-bold">New Routine</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Routine Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Workout, Daily Review"
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Interval</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setNewInterval(interval)}
                        className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize transition-all ${
                          newInterval === interval 
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
                {newInterval === 'weekly' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-semibold text-muted mb-2 block">Day of Week</label>
                    <select
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                      value={newDayOfWeek}
                      onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
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
                  <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Time Estimate (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500"
                      value={newEstimate}
                      onChange={(e) => setNewEstimate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Scheduling Mode</label>
                    {newTimeMode === 'window' ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground capitalize"
                          value={newTimeOfDay}
                          onChange={(e) => setNewTimeOfDay(e.target.value as RoutineTimeOfDay)}
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                        </select>
                        <button type="button" onClick={() => setNewTimeMode('exact')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Exact Time</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          required
                          className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                          value={newExactTime}
                          onChange={(e) => setNewExactTime(e.target.value)}
                        />
                        <button type="button" onClick={() => setNewTimeMode('window')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Any Time</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-semibold py-2.5 px-4 rounded-xl border border-surface-border transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  Create Routine
                </button>
              </div>
            </form>
          ) : isEditing && selectedRoutine ? (
            <form onSubmit={handleSaveEdit} className="animate-in fade-in duration-300 flex flex-col gap-6">
              <h3 className="text-xl font-bold">Edit Routine</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Routine Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Interval</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setEditInterval(interval)}
                        className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize transition-all ${
                          editInterval === interval 
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
                {editInterval === 'weekly' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-semibold text-muted mb-2 block">Day of Week</label>
                    <select
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                      value={editDayOfWeek}
                      onChange={(e) => setEditDayOfWeek(Number(e.target.value))}
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
                  <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Time Estimate (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500"
                      value={editEstimate}
                      onChange={(e) => setEditEstimate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted mb-2 block">Scheduling Mode</label>
                    {editTimeMode === 'window' ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground capitalize"
                          value={editTimeOfDay}
                          onChange={(e) => setEditTimeOfDay(e.target.value as RoutineTimeOfDay)}
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                        </select>
                        <button type="button" onClick={() => setEditTimeMode('exact')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Exact Time</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          required
                          className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                          value={editExactTime}
                          onChange={(e) => setEditExactTime(e.target.value)}
                        />
                        <button type="button" onClick={() => setEditTimeMode('window')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">Any Time</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-semibold py-2.5 px-4 rounded-xl border border-surface-border transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : selectedRoutine ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                    {selectedRoutine.routine_interval} Routine
                  </span>
                  <h2 className="text-2xl font-bold mt-2">{selectedRoutine.title}</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleStartEdit}
                    className="p-2 border border-surface-border hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-xl text-foreground transition-colors cursor-pointer"
                    title="Edit Routine"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-2 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                    title="Delete Routine"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface-hover-light dark:bg-surface-hover-dark p-4 rounded-xl border border-surface-border">
                  <h4 className="text-xs uppercase tracking-wider text-muted font-bold mb-1">Time Estimate</h4>
                  <p className="text-foreground font-semibold flex items-center gap-1.5">
                    <Clock size={16} className="text-brand-500" />
                    {selectedRoutine.time_estimate_minutes} minutes
                  </p>
                </div>

                <div className="bg-surface-hover-light dark:bg-surface-hover-dark p-4 rounded-xl border border-surface-border">
                  <h4 className="text-xs uppercase tracking-wider text-muted font-bold mb-1">Exact Time</h4>
                  <p className="text-foreground font-semibold capitalize">
                    {selectedRoutine.routine_exact_time || selectedRoutine.routine_time_of_day}
                    {selectedRoutine.routine_interval === 'weekly' && selectedRoutine.routine_day_of_week !== undefined && (
                      <span className="text-muted text-sm ml-1 normal-case">
                        on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedRoutine.routine_day_of_week]}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border border-surface-border rounded-xl p-4 flex gap-3 bg-surface/30">
                <AlertCircle className="shrink-0 mt-0.5 text-muted" size={18} />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Timeline Locking</h4>
                  <p className="text-xs text-muted mt-1">
                    This routine is automatically locked into your weekly plan calendar during the {selectedRoutine.routine_exact_time || selectedRoutine.routine_time_of_day} slot. It restricts your hourly capacity, ensuring you do not over-schedule your days.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted">
              <Repeat size={48} className="mb-4 opacity-20" />
              <p>Select a routine to view details, edit, or delete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
