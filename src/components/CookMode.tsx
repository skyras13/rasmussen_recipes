'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { IngredientData } from '@/components/IngredientList'
import { formatQuantity } from '@/lib/recipe-utils'

export type CookStep = {
  id: string
  text: string
  timerSeconds: number | null
}

/** Pull a usable timer out of step text: "simmer for 90 minutes", "22–25 min". */
export function detectTimerSeconds(text: string): number | null {
  const match = text.match(
    /(\d+)(?:\s*[–—-]\s*\d+)?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i,
  )
  if (!match) return null
  const value = Number(match[1])
  const unit = match[2].toLowerCase()
  if (unit.startsWith('h')) return value * 3600
  if (unit.startsWith('s')) return value
  return value * 60
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function StepTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setRemaining(seconds)
    setRunning(false)
  }, [seconds])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [running, remaining])

  const done = remaining === 0

  return (
    <div
      className={`flex items-center gap-3 rounded-box p-3 ${done ? 'bg-success text-success-content' : 'bg-base-200'}`}
    >
      <span className='font-mono text-2xl tabular-nums'>
        {done ? 'Done!' : formatClock(remaining)}
      </span>
      {!done && (
        <button
          type='button'
          className='btn btn-sm'
          onClick={() => setRunning((r) => !r)}
        >
          {running ? 'Pause' : remaining < seconds ? 'Resume' : 'Start timer'}
        </button>
      )}
      {(done || remaining < seconds) && (
        <button
          type='button'
          className='btn btn-sm btn-ghost'
          onClick={() => {
            setRemaining(seconds)
            setRunning(false)
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}

export default function CookMode({
  recipeId,
  title,
  servings,
  ingredients,
  steps,
}: {
  recipeId: string
  title: string
  servings: number
  ingredients: IngredientData[]
  steps: CookStep[]
}) {
  const [index, setIndex] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const wakeLock = useRef<{ release(): Promise<void> } | null>(null)

  // Keep the screen awake while cooking (best effort — not all browsers).
  useEffect(() => {
    let cancelled = false
    async function acquire() {
      try {
        const lock = await navigator.wakeLock?.request('screen')
        if (lock && !cancelled) wakeLock.current = lock
      } catch {
        // Screen may still sleep; cooking continues either way.
      }
    }
    acquire()
    return () => {
      cancelled = true
      wakeLock.current?.release().catch(() => {})
    }
  }, [])

  const next = useCallback(
    () => setIndex((i) => Math.min(steps.length - 1, i + 1)),
    [steps.length],
  )
  const previous = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' || event.key === ' ') next()
      if (event.key === 'ArrowLeft') previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, previous])

  const step = steps[index]
  const timer = step.timerSeconds ?? detectTimerSeconds(step.text)

  return (
    <div className='fixed inset-0 z-50 bg-base-100 flex flex-col'>
      <header className='flex items-center gap-2 p-4 border-b border-base-200'>
        <div className='flex-1 min-w-0'>
          <p className='text-sm text-base-content/60 truncate'>{title}</p>
          <p className='font-semibold'>
            Step {index + 1} of {steps.length}
          </p>
        </div>
        <button
          type='button'
          className='btn btn-ghost btn-sm'
          onClick={() => setShowIngredients((s) => !s)}
        >
          {showIngredients ? 'Hide' : 'Ingredients'}
        </button>
        <Link href={`/recipes/${recipeId}`} className='btn btn-ghost btn-sm'>
          ✕ Exit
        </Link>
      </header>

      <progress
        className='progress progress-primary w-full'
        value={index + 1}
        max={steps.length}
      />

      <main className='flex-1 overflow-y-auto flex'>
        {showIngredients && (
          <aside className='w-72 shrink-0 border-r border-base-200 p-4 overflow-y-auto hidden md:block'>
            <h2 className='font-semibold mb-2'>
              Ingredients · {servings} servings
            </h2>
            <ul className='space-y-1 text-sm'>
              {ingredients.map((ingredient) => (
                <li key={ingredient.id}>
                  {ingredient.quantity !== null && (
                    <strong>{formatQuantity(ingredient.quantity)} </strong>
                  )}
                  {ingredient.unit && `${ingredient.unit} `}
                  {ingredient.item}
                </li>
              ))}
            </ul>
          </aside>
        )}
        <div className='flex-1 flex flex-col items-center justify-center p-8 gap-8'>
          <p className='text-3xl md:text-4xl leading-relaxed max-w-2xl text-center'>
            {step.text}
          </p>
          {timer && <StepTimer seconds={timer} />}
        </div>
      </main>

      <footer className='flex items-center justify-between gap-4 p-4 border-t border-base-200'>
        <button
          type='button'
          className='btn btn-outline btn-lg'
          disabled={index === 0}
          onClick={previous}
        >
          ← Back
        </button>
        <span className='text-sm text-base-content/50 hidden sm:block'>
          Tip: use ←/→ arrow keys. The screen stays awake.
        </span>
        {index < steps.length - 1 ? (
          <button
            type='button'
            className='btn btn-primary btn-lg'
            onClick={next}
          >
            Next →
          </button>
        ) : (
          <Link
            href={`/recipes/${recipeId}`}
            className='btn btn-success btn-lg'
          >
            ✓ Finished!
          </Link>
        )}
      </footer>
    </div>
  )
}
