import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { api } from './api'

export type AppView = 'desktop' | 'mobile'
export type MobileViewTab = 'moleskine' | 'timeline'
export type DesktopViewTab = 'clarify' | 'next_actions' | 'plan' | 'projects' | 'reflect' | 'settings' | 'routines'

export type WorkSchedule = Record<number, {
  isActive: boolean
  startHour: string // HH:mm format
  endHour: string // HH:mm format
}>

export type TaskStatus = 'inbox' | 'next_action' | 'waiting' | 'done' | 'scheduled'
export type TaskType = 'standard' | 'routine' | 'event'
export type RoutineInterval = 'daily' | 'weekly' | 'monthly'
export type RoutineTimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface Project {
  id: string
  title: string
  outcome: string
  status: 'active' | 'completed' | 'someday'
}

export interface ChecklistItem {
  id: string
  text: string
  is_completed: boolean
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  type: TaskType
  is_routine: boolean
  routine_interval?: RoutineInterval
  routine_time_of_day?: RoutineTimeOfDay
  routine_exact_time?: string // HH:mm format
  routine_day_of_week?: number // 0-6 (0 = Sunday, 1 = Monday)
  event_date?: string // YYYY-MM-DD
  event_start_time?: string // HH:mm
  event_end_time?: string // HH:mm
  context: string | null
  time_estimate_minutes?: number
  start_time?: string
  scheduled_date?: string
  project_id?: string
  checklist?: ChecklistItem[]
  completed_at?: string
}

export interface TimeLog {
  id: string
  task_id: string
  duration_seconds: number
  log_type: 'active' | 'interrupted'
  created_at: string
}

export type FocusState = 'IDLE' | 'ACTIVE_WORKING' | 'INTERRUPTED'

interface AppState {
  // Auth State
  user: User | null
  setUser: (user: User | null) => void

  // Navigation State
  appView: AppView

  setAppView: (view: AppView) => void
  desktopTab: DesktopViewTab
  setDesktopTab: (tab: DesktopViewTab) => void
  mobileTab: MobileViewTab
  setMobileTab: (tab: MobileViewTab) => void
  
  projects: Project[]
  addProject: (p: Project) => void
  
  // Settings
  workSchedule: WorkSchedule
  updateWorkSchedule: (day: number, schedule: Partial<{isActive: boolean, startHour: string, endHour: string}>) => void
  
  // Tasks State (Mocking local state for now before full Supabase sync)
  tasks: Task[]
  timeLogs: TimeLog[]
  dailyReflections: Record<string, string>
  setDailyReflection: (date: string, note: string) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Focus Tracker State Machine
  focusState: FocusState
  activeTaskId: string | null
  activeTimeElapsedSeconds: number
  interruptedTimeElapsedSeconds: number
  startFocus: (taskId: string) => void
  interruptFocus: () => void
  resumeFocus: () => void
  stopFocus: () => void
  completeFocus: () => void
  tickTimer: () => void
  fetchInitialData: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  appView: 'desktop',
  setAppView: (view) => set({ appView: view }),
  desktopTab: 'clarify',
  setDesktopTab: (tab) => set({ desktopTab: tab }),
  mobileTab: 'moleskine',
  setMobileTab: (tab) => set({ mobileTab: tab }),

  projects: [],
  addProject: async (p) => {
    set((state) => ({ projects: [...state.projects, p] }))
    try { await api.createProject(p) } catch (err) { console.error('Failed to sync project:', err) }
  },

  workSchedule: {
    1: { isActive: true, startHour: '09:00', endHour: '17:00' }, // Mon
    2: { isActive: true, startHour: '09:00', endHour: '17:00' }, // Tue
    3: { isActive: true, startHour: '09:00', endHour: '17:00' }, // Wed
    4: { isActive: true, startHour: '09:00', endHour: '17:00' }, // Thu
    5: { isActive: true, startHour: '09:00', endHour: '15:00' }, // Fri
    6: { isActive: false, startHour: '09:00', endHour: '17:00' }, // Sat
    0: { isActive: false, startHour: '09:00', endHour: '17:00' }, // Sun
  },
  updateWorkSchedule: (day, schedule) => set((state) => ({
    workSchedule: { 
      ...state.workSchedule, 
      [day]: { ...state.workSchedule[day], ...schedule }
    }
  })),

  tasks: [],
  timeLogs: [],
  dailyReflections: {},
  setDailyReflection: async (date, note) => {
    set((state) => ({ dailyReflections: { ...state.dailyReflections, [date]: note } }))
    try { await api.upsertDailyReflection(date, note) } catch (err) { console.error('Failed to sync reflection:', err) }
  },
  addTask: async (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }))
    try { await api.createTask(task) } catch (err) { console.error('Failed to sync task:', err) }
  },
  updateTask: async (id, updates) => {
    const finalUpdates = { ...updates }
    if (updates.status === 'done' && !updates.completed_at) {
      finalUpdates.completed_at = new Date().toISOString()
    }
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...finalUpdates } : t)
    }))
    try { await api.updateTask(id, finalUpdates) } catch (err) { console.error('Failed to sync update:', err) }
  },
  deleteTask: async (id) => {
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }))
    try { await api.deleteTask(id) } catch (err) { console.error('Failed to sync delete:', err) }
  },

  focusState: 'IDLE',
  activeTaskId: null,
  activeTimeElapsedSeconds: 0,
  interruptedTimeElapsedSeconds: 0,

  startFocus: (taskId) => set({ 
    focusState: 'ACTIVE_WORKING', 
    activeTaskId: taskId, 
    activeTimeElapsedSeconds: 0, 
    interruptedTimeElapsedSeconds: 0 
  }),
  interruptFocus: () => set({ focusState: 'INTERRUPTED' }),
  resumeFocus: async () => {
    const { activeTaskId, interruptedTimeElapsedSeconds } = get()
    if (activeTaskId && interruptedTimeElapsedSeconds > 0) {
      const log: TimeLog = { id: crypto.randomUUID(), task_id: activeTaskId, duration_seconds: interruptedTimeElapsedSeconds, log_type: 'interrupted', created_at: new Date().toISOString() }
      set(state => ({ timeLogs: [...state.timeLogs, log] }))
      try {
        await api.logTime(activeTaskId, interruptedTimeElapsedSeconds, 'interrupted')
      } catch (err) {
        console.error('Failed to log interrupted time:', err)
      }
    }
    set({ focusState: 'ACTIVE_WORKING', interruptedTimeElapsedSeconds: 0 })
  },
  stopFocus: async () => {
    const { activeTaskId, activeTimeElapsedSeconds } = get()
    if (activeTaskId && activeTimeElapsedSeconds > 0) {
      const log: TimeLog = { id: crypto.randomUUID(), task_id: activeTaskId, duration_seconds: activeTimeElapsedSeconds, log_type: 'active', created_at: new Date().toISOString() }
      set(state => ({ timeLogs: [...state.timeLogs, log] }))
      try {
        await api.logTime(activeTaskId, activeTimeElapsedSeconds, 'active')
      } catch (err) {
        console.error('Failed to log time:', err)
      }
    }
    set({ focusState: 'IDLE', activeTaskId: null, activeTimeElapsedSeconds: 0, interruptedTimeElapsedSeconds: 0 })
  },
  completeFocus: async () => {
    const { activeTaskId, activeTimeElapsedSeconds } = get()
    if (activeTaskId) {
      get().updateTask(activeTaskId, { status: 'done' }) // This automatically injects completed_at
      if (activeTimeElapsedSeconds > 0) {
        const log: TimeLog = { id: crypto.randomUUID(), task_id: activeTaskId, duration_seconds: activeTimeElapsedSeconds, log_type: 'active', created_at: new Date().toISOString() }
        set(state => ({ timeLogs: [...state.timeLogs, log] }))
        try {
          await api.logTime(activeTaskId, activeTimeElapsedSeconds, 'active')
        } catch (err) {
          console.error('Failed to log time:', err)
        }
      }
    }
    set({ focusState: 'IDLE', activeTaskId: null, activeTimeElapsedSeconds: 0, interruptedTimeElapsedSeconds: 0 })
  },
  tickTimer: () => set((state) => {
    if (state.focusState === 'ACTIVE_WORKING') {
      return { activeTimeElapsedSeconds: state.activeTimeElapsedSeconds + 1 }
    }
    if (state.focusState === 'INTERRUPTED') {
      return { interruptedTimeElapsedSeconds: state.interruptedTimeElapsedSeconds + 1 }
    }
    return {}
  }),
  fetchInitialData: async () => {
    try {
      const user = await api.getUser()
      if (!user) return
      set({ user })

      const [projects, tasks, logs, reflections] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getTimeLogs(),
        api.getDailyReflections()
      ])

      const reflectionsMap: Record<string, string> = {}
      reflections?.forEach((r: { date: string, note: string }) => { reflectionsMap[r.date] = r.note })

      set({
        projects: projects || [],
        tasks: tasks || [],
        timeLogs: logs || [],
        dailyReflections: reflectionsMap
      })
    } catch (err) {
      console.error('Failed to fetch initial data:', err)
    }
  }
}))
