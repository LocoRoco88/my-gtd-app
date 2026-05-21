import { supabase } from './supabase'
import { Task, Project } from './store'

function sanitizeTask(task: Partial<Task>) {
  const allowedKeys: (keyof Task)[] = [
    'id',
    'project_id',
    'title',
    'status',
    'type',
    'routine_interval',
    'context',
    'time_estimate_minutes',
    'scheduled_date',
    'is_routine',
    'routine_time_of_day',
    'routine_exact_time',
    'routine_day_of_week',
    'event_date',
    'event_start_time',
    'event_end_time',
    'completed_at',
    'checklist'
  ]
  const sanitized: any = {}
  for (const key of allowedKeys) {
    if (key in task) {
      sanitized[key] = task[key]
    }
  }
  return sanitized
}

// Auth API
export const api = {
  // Authentication
  async signInWithEmail(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) throw error
    return data
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Projects
  async getProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      outcome: p.outcome_description || '',
      status: p.status
    })) as Project[]
  },

  async createProject(project: Partial<Project>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const dbProject = {
      id: project.id,
      user_id: user.id,
      title: project.title,
      outcome_description: project.outcome,
      status: project.status
    }
    const { data, error } = await supabase.from('projects').insert([dbProject]).select().single()
    if (error) throw error
    return {
      id: data.id,
      title: data.title,
      outcome: data.outcome_description || '',
      status: data.status
    } as Project
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data as Task[]
  },

  async createTask(task: Partial<Task>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const sanitized = sanitizeTask(task)
    const { data, error } = await supabase.from('tasks').insert([{ ...sanitized, user_id: user.id }]).select().single()
    if (error) throw error
    return data as Task
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const sanitized = sanitizeTask(updates)
    const { data, error } = await supabase.from('tasks').update(sanitized).eq('id', id).select().single()
    if (error) throw error
    return data as Task
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },

  // Time Logs
  async getTimeLogs() {
    const { data, error } = await supabase.from('time_logs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async logTime(taskId: string, durationSeconds: number, logType: 'active' | 'interrupted') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.from('time_logs').insert([{
      user_id: user.id,
      task_id: taskId,
      duration_seconds: durationSeconds,
      log_type: logType
    }]).select().single()
    
    if (error) throw error
    return data
  },

  // Daily Reflections
  async getDailyReflections() {
    const { data, error } = await supabase.from('daily_reflections').select('*')
    if (error) throw error
    return data
  },

  async upsertDailyReflection(date: string, note: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.from('daily_reflections').upsert({
      date,
      user_id: user.id,
      note
    }, { onConflict: 'date, user_id' }).select().single()
    
    if (error) throw error
    return data
  }
}
