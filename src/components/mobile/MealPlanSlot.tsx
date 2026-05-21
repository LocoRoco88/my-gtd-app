'use client'

import { useState } from 'react'
import { Utensils, X, CheckSquare, Square } from 'lucide-react'

export function MealPlanSlot() {
  const [isOpen, setIsOpen] = useState(false)
  const [ingredientsChecked, setIngredientsChecked] = useState<Record<string, boolean>>({})

  // Mock meal data
  const meal = {
    title: 'Grilled Salmon & Asparagus',
    recipe: '1. Season salmon. 2. Grill for 12 mins. 3. Sauté asparagus with garlic.',
    ingredients: ['Salmon Fillets (2)', 'Asparagus (1 bunch)', 'Garlic (2 cloves)', 'Olive Oil', 'Lemon']
  }

  const toggleIngredient = (ing: string) => {
    setIngredientsChecked(prev => ({ ...prev, [ing]: !prev[ing] }))
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center transition-colors shadow-sm"
      >
        <Utensils size={16} />
      </button>

      {/* Slide-up Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="relative bg-surface border-t border-surface-border rounded-t-3xl shadow-2xl p-6 pb-12 animate-in slide-in-from-bottom-full duration-300">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-surface-hover-light dark:bg-surface-hover-dark rounded-full"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                <Utensils size={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest">Dagens Måltid</h2>
                <h3 className="text-2xl font-bold">{meal.title}</h3>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3">Ingredients Checklist</h4>
              <div className="flex flex-col gap-2">
                {meal.ingredients.map(ing => {
                  const isChecked = ingredientsChecked[ing]
                  return (
                    <button 
                      key={ing}
                      onClick={() => toggleIngredient(ing)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-background hover:border-orange-300 transition-colors text-left"
                    >
                      {isChecked ? (
                        <CheckSquare className="text-orange-500 shrink-0" />
                      ) : (
                        <Square className="text-muted shrink-0" />
                      )}
                      <span className={`font-medium ${isChecked ? 'line-through text-muted' : 'text-foreground'}`}>
                        {ing}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Recipe</h4>
              <p className="text-muted leading-relaxed p-4 bg-surface-hover-light dark:bg-surface-hover-dark rounded-xl border border-surface-border">
                {meal.recipe}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
