'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

export function ContextSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const contexts = ['@computer', '@home', '@errands', '@phone']

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 min-[360px]:gap-1.5 bg-surface hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark border border-surface-border px-2.5 py-1 min-[360px]:px-3 min-[360px]:py-1.5 rounded-full text-xs min-[360px]:text-sm font-medium transition-colors"
      >
        <MapPin className="text-brand-500 w-3.5 h-3.5 min-[360px]:w-3.5 min-[360px]:h-3.5" />
        <span>Context</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2 text-xs font-bold text-muted uppercase tracking-wider">Select Context</div>
          {contexts.map(ctx => (
            <button 
              key={ctx}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
            >
              {ctx}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
