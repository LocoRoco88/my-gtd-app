import { supabase } from './supabase'
import { Task, Project, TaskStatus, TaskType } from './store'

// Auth API
export const api = {
  // Authentication
  async signInWithEmail(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({ email })
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
    return data
  },

  async createProject(project: Partial<Project>) {
    const { data, error } = await supabase.from('projects').insert([project]).select().single()
    if (error) throw error
    return data
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async createTask(task: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').insert([task]).select().single()
    if (error) throw error
    return data
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
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
