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
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-8">
      <form onSubmit={handleCapture} className="relative max-w-sm mx-auto shadow-2xl shadow-brand-500/10 rounded-full">
        <input 
          type="text" 
          placeholder="Capture to inbox..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-lg placeholder:text-muted/70"
        />
        <button 
          type="submit"
          disabled={!title.trim()}
          className="absolute right-2 top-2 bottom-2 w-10 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-border text-white rounded-full flex items-center justify-center transition-all"
        >
          <Plus size={24} />
        </button>
      </form>
    </div>
  )
}
