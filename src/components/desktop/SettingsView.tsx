'use client'

import { useStore } from '@/lib/store'
import { Briefcase } from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

export function SettingsView() {
  const { workSchedule, updateWorkSchedule } = useStore()

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted mt-1">Configure your personal Life OS preferences.</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-surface-border">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-border">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Work Schedule</h3>
            <p className="text-sm text-muted">Customize your working hours for each day of the week.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {DAYS_OF_WEEK.map(day => {
            const daySchedule = workSchedule[day.value] || { isActive: false, startHour: '09:00', endHour: '17:00' }
            
            return (
              <div key={day.value} className="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-xl">
                <div className="flex items-center gap-4 w-40">
                  <input 
                    type="checkbox"
                    checked={daySchedule.isActive}
                    onChange={(e) => updateWorkSchedule(day.value, { isActive: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                  <span className={`font-medium ${daySchedule.isActive ? 'text-foreground' : 'text-muted'}`}>
                    {day.label}
                  </span>
                </div>

                <div className={`flex items-center gap-4 transition-opacity ${daySchedule.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-medium">From</span>
                    <input 
                      type="time" 
                      value={daySchedule.startHour}
                      onChange={(e) => updateWorkSchedule(day.value, { startHour: e.target.value })}
                      className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-medium">To</span>
                    <input 
                      type="time" 
                      value={daySchedule.endHour}
                      onChange={(e) => updateWorkSchedule(day.value, { endHour: e.target.value })}
                      className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
