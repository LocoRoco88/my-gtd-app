'use client'

import { useState } from 'react'
import { useStore, Task, ChecklistItem } from '@/lib/store'
import { AlertTriangle, Plus, FolderKanban, ListChecks, X, Check, Trash2 } from 'lucide-react'
import { TimeBadge } from '@/components/ui/TimeBadge'

export function ProjectDashboard() {
  const { 
    projects, 
    tasks, 
    addProject, 
    addTask, 
    updateTask, 
    deleteTask, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useStore()

  // Project creation form states
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectOutcome, setNewProjectOutcome] = useState('')

  // Task inline creation state
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const activeProjects = projects.filter(p => p.status === 'active')

  // Helper to check if a project is stagnant
  const isProjectStagnant = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId)
    return !projectTasks.some(t => t.status === 'next_action')
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const projectTasks = selectedProject ? tasks.filter(t => t.project_id === selectedProject.id) : []

  const handleStartCreateProject = () => {
    setNewProjectTitle('')
    setNewProjectOutcome('')
    setIsCreatingProject(true)
    setSelectedProjectId(null)
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectTitle.trim()) return

    const newId = crypto.randomUUID()
    addProject({
      id: newId,
      title: newProjectTitle.trim(),
      outcome: newProjectOutcome.trim() || 'Define desired outcome',
      status: 'active'
    })

    setSelectedProjectId(newId)
    setIsCreatingProject(false)
  }

  const handleStartAddTask = () => {
    setNewTaskTitle('')
    setIsAddingTask(true)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !newTaskTitle.trim()) return

    addTask({
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      status: 'next_action',
      type: 'standard',
      is_routine: false,
      context: null,
      project_id: selectedProject.id
    })

    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  const TaskRow = ({ task }: { task: Task }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [newItemText, setNewItemText] = useState('')
    
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
      <div className={`group flex flex-col p-3 bg-background hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-lg border ${isExpanded ? 'border-brand-500 shadow-md' : 'border-surface-border shadow-sm'} transition-all`}>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                updateTask(task.id, { status: task.status === 'done' ? 'next_action' : 'done' }); 
              }}
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center shrink-0 ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-brand-400 hover:bg-brand-500 hover:border-brand-500 text-transparent hover:text-white'}`}
            >
              <Check size={12} />
            </button>
            
            <div className="flex flex-col overflow-hidden">
              <span className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted' : 'text-foreground'}`}>
                {task.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <TimeBadge task={task} />
                {checklist.length > 0 && (
                  <span className={`flex items-center gap-1 text-[9px] font-bold px-1 rounded ${completedCount === checklist.length ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-muted bg-surface-border'}`}>
                    <ListChecks size={8} /> {completedCount}/{checklist.length}
                  </span>
                )}
                {task.context && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-hover-light dark:bg-surface-hover-dark text-muted shrink-0">
                    {task.context.replace(/[\[\]]/g, '')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pl-2 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-1.5 rounded-md text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Inline Checklist Expansion */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-surface-border animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-1.5 ml-8 mb-2">
              {checklist.map((item: ChecklistItem) => (
                <div key={item.id} className="flex items-center gap-2 group/item">
                  <button 
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${item.is_completed ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-border hover:border-brand-500'}`}
                  >
                    {item.is_completed && <Check size={8} />}
                  </button>
                  <span className={`text-xs flex-1 ${item.is_completed ? 'line-through text-muted' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-muted hover:text-red-500 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddChecklistItem} className="ml-8 flex items-center gap-2 mt-2">
              <Plus size={12} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Add checklist item..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
              />
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active Projects</h2>
          <p className="text-muted mt-1">Manage outcomes that require multiple steps.</p>
        </div>
        <button 
          onClick={handleStartCreateProject}
          className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="flex gap-6 h-full overflow-hidden pb-10">
        {/* Project List */}
        <div className="w-1/3 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10">
          {activeProjects.map(project => {
            const stagnant = isProjectStagnant(project.id)
            const isSelected = selectedProjectId === project.id

            return (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setIsCreatingProject(false)
                  setIsAddingTask(false)
                }}
                className={`relative flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isSelected 
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 shadow-md' 
                    : 'bg-surface hover:border-brand-300 border-surface-border'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={18} className="text-brand-500" />
                    <h3 className="font-bold text-foreground">{project.title}</h3>
                  </div>
                  {stagnant && (
                    <div className="animate-pulse bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full" title="Stagnant: No Next Actions defined">
                      <AlertTriangle size={16} />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted mt-2 line-clamp-2">{project.outcome}</p>
              </button>
            )
          })}
        </div>

        {/* Project Detail */}
        <div className="flex-1 glass rounded-2xl border border-surface-border p-6 overflow-y-auto no-scrollbar relative min-h-[400px]">
          {isCreatingProject ? (
            <form onSubmit={handleCreateProject} className="animate-in fade-in duration-300 flex flex-col gap-6">
              <h3 className="text-xl font-bold">New Project</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Redesign Homepage, Prepare Tax Return"
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted mb-2 block">Desired Outcome (Success Criteria)</label>
                  <textarea
                    rows={4}
                    placeholder="What does success look like? (e.g. Homepage is live with a modern design system and mobile responsive layout)"
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    value={newProjectOutcome}
                    onChange={(e) => setNewProjectOutcome(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="flex-1 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-surface-border text-foreground font-semibold py-2.5 px-4 rounded-xl border border-surface-border transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          ) : selectedProject ? (
            <div className="animate-in fade-in duration-300">
              {isProjectStagnant(selectedProject.id) && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Stagnant Project Alarm</h4>
                    <p className="text-sm mt-1">This project has zero tasks marked as &quot;Next Action&quot;. It is stuck. Define the very next physical action to move this forward.</p>
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
              <div className="bg-surface-hover-light dark:bg-surface-hover-dark p-4 rounded-xl border border-surface-border mb-8">
                <h4 className="text-xs uppercase tracking-wider text-muted font-bold mb-1">Desired Outcome</h4>
                <p className="text-foreground">{selectedProject.outcome}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Tasks Column */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Tasks</h3>
                    <button 
                      onClick={handleStartAddTask}
                      className="text-brand-600 dark:text-brand-400 hover:underline text-sm font-medium flex items-center cursor-pointer"
                    >
                      <Plus size={14} className="mr-1" /> Add
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {isAddingTask && (
                      <form onSubmit={handleAddTask} className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-lg border border-brand-500 shadow-sm animate-in slide-in-from-top-2 duration-200">
                        <input
                          type="text"
                          required
                          autoFocus
                          placeholder="What is the next action?"
                          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="submit"
                            className="p-1 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingTask(false)}
                            className="p-1 rounded-md text-muted hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </form>
                    )}
                    {projectTasks.length === 0 && !isAddingTask ? (
                      <p className="text-muted text-sm italic">No tasks. Define a next action.</p>
                    ) : (
                      projectTasks.map(task => (
                        <TaskRow key={task.id} task={task} />
                      ))
                    )}
                  </div>
                </div>

                {/* Notes & References Column */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Reference Notes</h3>
                  </div>
                  <div className="h-64 bg-background border border-surface-border rounded-xl p-4 shadow-inner text-muted text-sm font-mono overflow-y-auto">
                    <p># Project Notes</p>
                    <p>- Remember to check the dimensions.</p>
                    <p>- Budget limit: $5000</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted">
              <FolderKanban size={48} className="mb-4 opacity-20" />
              <p>Select a project to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
