'use client'

import { useState } from 'react'
import { X, Copy, Check, Sparkles } from 'lucide-react'

interface MagicWandModalProps {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  timeEstimate: number
}

export function MagicWandModal({ isOpen, onClose, taskTitle, timeEstimate }: MagicWandModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const promptText = `Jeg har denne opgave: '${taskTitle}' som forventes at tage ${timeEstimate} minutter. Kan du opdele den i mindre, konkrete, og sekventielle handlingstrin (micro-actions) på under 15 minutter hver? Formater venligst dit svar som en simpel punktopstilling (hvert punkt starter med '-' eller tal), så jeg kan kopiere dem direkte.`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-surface border border-surface-border w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 font-sans">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Sparkles size={20} className="animate-pulse" />
            <h3 className="font-bold text-lg text-foreground">Generer mikro-trin med AI</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted mb-4 leading-relaxed">
          Kopier denne prompt og indsæt den i ChatGPT, Claude eller Gemini for at bryde opgaven ned i mindre delopgaver. Derefter kan du indsætte resultatet i "Smart Paste"-feltet på opgaven.
        </p>

        <div className="relative bg-background border border-surface-border rounded-xl p-4 font-mono text-sm text-foreground max-h-40 overflow-y-auto mb-6 select-all">
          {promptText}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-surface-border text-sm font-semibold hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-foreground transition-colors"
          >
            Luk
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-brand-500/10 active:scale-95"
          >
            {copied ? (
              <>
                <Check size={16} /> Kopieret!
              </>
            ) : (
              <>
                <Copy size={16} /> Kopier Prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
