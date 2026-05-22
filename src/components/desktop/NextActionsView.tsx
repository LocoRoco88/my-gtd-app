'use client'

import { useState } from 'react'
import { useStore, Task, ChecklistItem } from '@/lib/store'
import { Check, Trash2, Tag, FolderKanban, ListChecks, Plus, X } from 'lucide-react'
import { TimeBadge } from '@/components/ui/TimeBadge'

export function NextActionsView() {
  const { tasks, projects, updateTask, deleteTask } = useStore()
  const [groupBy, setGroupBy] = useState<'project' | 'context'>('project')

  // Filter for next actions (exclude events and routines)
  const nextActions = tasks.filter(t => t.status === 'next_action' && t.type === 'standard' && !t.is_routine)

  const renderGroupedTasks = () => {
    if (groupBy === 'project') {
      const grouped = nextActions.reduce((acc, task) => {
        const key = task.project_id || 'standalone'
        if (!acc[key]) acc[key] = []
        acc[key].push(task)
        return acc
      }, {} as Record<string, typeof nextActions>)

      const standalone = grouped['standalone'] || []
      const projectGroups = Object.keys(grouped).filter(k => k !== 'standalone').map(projectId => {
        return {
          project: projects.find(p => p.id === projectId),
          tasks: grouped[projectId]
        }
      })

      return (
        <div className="flex flex-col gap-8">
          {projectGroups.map(group => group.project && (
            <div key={group.project.id}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                <FolderKanban size={20} className="text-brand-500" />
                {group.project.title}
              </h3>
              <div className="flex flex-col gap-2">
                {group.tasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            </div>
          ))}
          
          {standalone.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Standalone Actions</h3>
              <div className="flex flex-col gap-2">
                {standalone.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            </div>
          )}
        </div>
      )
    } else {
      const grouped = nextActions.reduce((acc, task) => {
        const key = task.context || 'none'
        if (!acc[key]) acc[key] = []
        acc[key].push(task)
        return acc
      }, {} as Record<string, typeof nextActions>)

      const noContext = grouped['none'] || []
      const contextGroups = Object.keys(grouped).filter(k => k !== 'none')

      return (
        <div className="flex flex-col gap-8">
          {contextGroups.map(context => (
            <div key={context}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground capitalize">
                <Tag size={20} className="text-accent-dark" />
                {context.replace(/[\[\]]/g, '')}
              </h3>
              <div className="flex flex-col gap-2">
                {grouped[context].map(task => <TaskRow key={task.id} task={task} showProjectBadge />)}
              </div>
            </div>
          ))}

          {noContext.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">No Context</h3>
              <div className="flex flex-col gap-2">
                {noContext.map(task => <TaskRow key={task.id} task={task} showProjectBadge />)}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  const TaskRow = ({ task, showProjectBadge = false }: { task: Task, showProjectBadge?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [newItemText, setNewItemText] = useState('')
    const [showSmartPaste, setShowSmartPaste] = useState(false)
    const [smartPasteText, setSmartPasteText] = useState('')
    
    const project = showProjectBadge && task.project_id ? projects.find(p => p.id === task.project_id) : null
    const checklist = task.checklist || []
    const completedCount = checklist.filter((c: ChecklistItem) => c.is_completed).length

    const handleAddChecklistItem = (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (!newItemText.trim()) return
      const newItem: ChecklistItem = { id: crypto.randomUUID(), text: newItemText.trim(), is_completed: false }
      updateTask(task.id, { checklist: [...checklist, newItem] })
      setNewItemText('')
    }

    const toggleChecklistItem = (itemId: string) => {
      const updated = checklist.map((c: ChecklistItem) => c.id === itemId ? { ...c, is_completed: !c.is_completed } : c)
      updateTask(task.id, { checklist: updated })
    }

    const deleteChecklistItem = (itemId: string) => {
      const updated = checklist.filter((c: ChecklistItem) => c.id !== itemId)
      updateTask(task.id, { checklist: updated })
    }

    return (
      <div className={`group flex flex-col p-4 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-xl border ${isExpanded ? 'border-brand-500 shadow-md' : 'border-surface-border shadow-sm'} transition-all`}>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <button 
              onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'done' }); }}
              className="w-6 h-6 rounded border border-brand-400 hover:bg-brand-500 hover:border-brand-500 transition-colors flex items-center justify-center text-transparent hover:text-white shrink-0"
            >
              <Check size={14} />
            </button>
            
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground truncate">{task.title}</span>
              <div className="flex items-center gap-2 mt-1">
                <TimeBadge task={task} />
                {checklist.length > 0 && (
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${completedCount === checklist.length ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-muted bg-surface-border'}`}>
                    <ListChecks size={10} /> {completedCount}/{checklist.length}
                  </span>
                )}
                {showProjectBadge && project && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 truncate">
                    {project.title}
                  </span>
                )}
                {!showProjectBadge && task.context && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark shrink-0">
                    {task.context.replace(/[\[\]]/g, '')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pl-4 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Inline Checklist Expansion */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-surface-border animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
            
            {/* Time Estimate Editor */}
            <div className="ml-10 mb-4 pb-4 border-b border-surface-border/50">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Tidsestimat</span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '5m', value: 5 },
                  { label: '15m', value: 15 },
                  { label: '30m', value: 30 },
                  { label: '1t', value: 60 },
                  { label: '2t', value: 120 }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateTask(task.id, { time_estimate_minutes: opt.value })}
                    className={`py-1 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      task.time_estimate_minutes === opt.value
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                        : 'bg-background border-surface-border text-foreground hover:bg-surface-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="number"
                    min="1"
                    value={task.time_estimate_minutes || ''}
                    onChange={(e) => updateTask(task.id, { time_estimate_minutes: Number(e.target.value) || undefined })}
                    className="w-14 bg-background border border-surface-border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold text-center text-foreground"
                  />
                  <span className="text-xs text-muted">min.</span>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="flex flex-col gap-2 ml-10 mb-3">
              {checklist.map((item: ChecklistItem) => (
                <div key={item.id} className="flex items-center gap-3 group/item">
                  <button 
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.is_completed ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-border hover:border-brand-500'}`}
                  >
                    {item.is_completed && <Check size={10} />}
                  </button>
                  <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-muted' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-muted hover:text-red-500 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddChecklistItem} className="ml-10 flex items-center gap-3">
              <Plus size={14} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Add checklist item..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                autoFocus
              />
            </form>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSmartPaste(!showSmartPaste)}
                className="text-[11px] text-brand-500 hover:text-brand-600 font-semibold transition-colors"
              >
                {showSmartPaste ? 'Skjul Smart Paste' : 'Brug Smart Paste (AI listen)'}
              </button>
            </div>

            {showSmartPaste && (
              <div className="mt-3 ml-10 p-3 border border-surface-border rounded-xl bg-background animate-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-semibold text-muted mb-1.5 block">
                  Indsæt din punktopstilling fra fx ChatGPT / Claude / Gemini:
                </label>
                <textarea
                  value={smartPasteText}
                  onChange={(e) => setSmartPasteText(e.target.value)}
                  placeholder={`Eksempel:
- Skriv kladde til mail
- Send mail til bossen
- Afvent svar`}
                  rows={3}
                  className="w-full bg-surface-hover-light dark:bg-surface-hover-dark border border-surface-border rounded-lg p-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 resize-y mb-2 font-mono"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSmartPasteText('')
                      setShowSmartPaste(false)
                    }}
                    className="px-2 py-1 rounded-md border border-surface-border text-[11px] font-semibold hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-foreground transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!smartPasteText.trim()) return
                      const lines = smartPasteText.split('\n')
                      const parsedItems = lines
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .map(line => {
                          const match = line.match(/^([-*•+]|\d+\.)\s*(.+)$/)
                          if (match) {
                            return match[2].trim()
                          }
                          if (/^[-*•+]$/.test(line)) return null
                          return line
                        })
                        .filter((item): item is string => item !== null && item.length > 0)

                      if (parsedItems.length > 0) {
                        const newChecklistItems = parsedItems.map(text => ({
                          id: crypto.randomUUID(),
                          text,
                          is_completed: false
                        }))
                        updateTask(task.id, { checklist: [...checklist, ...newChecklistItems] })
                      }
                      setSmartPasteText('')
                      setShowSmartPaste(false)
                    }}
                    className="px-2 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                  >
                    Importer delopgaver
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-sans max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Next Actions</h2>
          <p className="text-muted mt-1">Master list of all unscheduled, actionable items.</p>
        </div>

        <div className="bg-surface p-1 rounded-xl flex items-center border border-surface-border shadow-sm">
          <button 
            onClick={() => setGroupBy('project')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${groupBy === 'project' ? 'bg-background shadow-sm text-brand-600 dark:text-brand-400' : 'text-muted hover:text-foreground'}`}
          >
            By Project
          </button>
          <button 
            onClick={() => setGroupBy('context')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${groupBy === 'context' ? 'bg-background shadow-sm text-brand-600 dark:text-brand-400' : 'text-muted hover:text-foreground'}`}
          >
            By Context
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {nextActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted">
            <Check size={48} className="mb-4 text-brand-200 dark:text-brand-800 opacity-50" />
            <p>You have no next actions pending.</p>
          </div>
        ) : (
          renderGroupedTasks()
        )}
      </div>
    </div>
  )
}
