'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Plus } from 'lucide-react'

export function CaptureBar() {
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
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-5">
      <form onSubmit={handleCapture} className="relative max-w-sm mx-auto shadow-xl shadow-brand-500/5 rounded-full">
        <input 
          type="text" 
          placeholder="Capture to inbox..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-base placeholder:text-muted/70"
        />
        <button 
          type="submit"
          disabled={!title.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-border text-white rounded-full flex items-center justify-center transition-all"
        >
          <Plus size={20} />
        </button>
      </form>
    </div>
  )
}
