'use client'

import { useStore } from '@/lib/store'
import { Inbox, FolderKanban, ActivitySquare, CalendarDays, Settings, Repeat, ListTodo } from 'lucide-react'
import { ClarifyWizard } from './ClarifyWizard'
import { WeeklyPlanningWizard } from './WeeklyPlanningWizard'
import { ProjectDashboard } from './ProjectDashboard'
import { ReflectView } from './ReflectView'
import { SettingsView } from './SettingsView'
import { RoutineDashboard } from './RoutineDashboard'
import { NextActionsView } from './NextActionsView'
import { DesktopCaptureBar } from './DesktopCaptureBar'
import { FocusTrackerBar } from './FocusTrackerBar'

export function DesktopHub() {
  const { desktopTab, setDesktopTab } = useStore()

  const tabs = [
    { id: 'clarify', label: 'Clarify Wizard', icon: Inbox },
    { id: 'next_actions', label: 'Next Actions', icon: ListTodo },
    { id: 'plan', label: 'Weekly Plan', icon: CalendarDays },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'routines', label: 'Routines', icon: Repeat },
    { id: 'reflect', label: 'Reflect', icon: ActivitySquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="flex h-full w-full bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-surface-border bg-surface/50 backdrop-blur-xl flex flex-col p-4 gap-2">
        <div className="mb-8 px-2">
          <h1 className="font-bold text-xl tracking-tight text-brand-600 dark:text-brand-400">MyGTD OS</h1>
          <p className="text-xs text-muted font-medium uppercase tracking-wider mt-1">Planning Hub</p>
        </div>
        
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = desktopTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setDesktopTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                    : 'text-muted hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:text-foreground'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-muted'} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <FocusTrackerBar />
        <div className="flex-1 overflow-y-auto p-8 pb-28 relative">
          {desktopTab === 'clarify' && <ClarifyWizard />}
          {desktopTab === 'next_actions' && <NextActionsView />}
          {desktopTab === 'plan' && <WeeklyPlanningWizard />}
          {desktopTab === 'projects' && <ProjectDashboard />}
          {desktopTab === 'routines' && <RoutineDashboard />}
          {desktopTab === 'reflect' && <ReflectView />}
          {desktopTab === 'settings' && <SettingsView />}
        </div>
        
        {/* Floating Desktop Capture Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 z-30">
          <DesktopCaptureBar />
        </div>
      </main>
    </div>
  )
}
