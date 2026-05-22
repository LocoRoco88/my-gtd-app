'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Plus, Inbox } from 'lucide-react'

export function DesktopCaptureBar() {
  const [title, setTitle] = useState('')
  const { addTask } = useStore()

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addTask({
      id: crypto.randomUUID(),
      title: title.trim(),
      status: 'inbox',
      type: 'standard',
      is_routine: false,
      context: null
    })
    
    setTitle('')
  }

  return (
    <div className="w-full">
      <form 
        onSubmit={handleCapture} 
        className="relative shadow-2xl shadow-brand-500/10 rounded-2xl border border-surface-border bg-surface/85 backdrop-blur-md p-2.5 flex items-center gap-2 group transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent focus-within:scale-[1.01] focus-within:bg-surface"
      >
        <div className="pl-3 text-muted shrink-0">
          <Inbox size={18} className="group-focus-within:text-brand-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Quick capture to inbox (e.g. Write project pitch)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none py-1.5 text-base text-foreground placeholder:text-muted/50"
        />
        <div className="flex items-center gap-3 shrink-0 pr-1">
          {title.trim() && (
            <span className="text-[10px] font-bold text-muted bg-surface-border/50 px-2 py-1 rounded">
              Press Enter
            </span>
          )}
          <button 
            type="submit"
            disabled={!title.trim()}
            className="h-9 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-border disabled:text-muted/50 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all text-sm active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            Capture
          </button>
        </div>
      </form>
    </div>
  )
}
