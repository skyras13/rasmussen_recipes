'use client'

import { useActionState, useState } from 'react'
import { createRecipe, type RecipeFormState } from '@/app/actions/recipes'

type Row = { key: number }

export type RecipeFormInitial = {
  forkedFromId?: string
  forkedFromTitle?: string
  // Set by the card scanner: the uploaded photo of the original recipe
  // card, preserved on the recipe as an heirloom artifact.
  originalCardUrl?: string
  banner?: string
  title: string
  description: string
  story: string
  originalAuthor: string
  originEra: string
  originPlace: string
  servings: number
  prepMin: number | null
  cookMin: number | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  cuisine: string
  tags: string
  ingredients: Array<{
    quantity: string
    unit: string
    item: string
    note: string
  }>
  steps: string[]
}

function useRows(initial: number) {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: initial }, (_, i) => ({ key: i })),
  )
  const [nextKey, setNextKey] = useState(initial)

  function add() {
    setRows((prev) => [...prev, { key: nextKey }])
    setNextKey((k) => k + 1)
  }
  function remove(key: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.key !== key) : prev,
    )
  }
  return { rows, add, remove }
}

const initialState: RecipeFormState = { error: null }

export default function RecipeForm({
  families = [],
  initial,
}: {
  families?: Array<{ id: string; name: string }>
  initial?: RecipeFormInitial
}) {
  const [state, formAction, pending] = useActionState(
    createRecipe,
    initialState,
  )
  const ingredients = useRows(initial?.ingredients.length ?? 3)
  const steps = useRows(initial?.steps.length ?? 2)

  return (
    <form action={formAction} className='space-y-8'>
      {state.error && (
        <div role='alert' className='alert alert-error'>
          {state.error}
        </div>
      )}

      {initial?.forkedFromTitle && (
        <div className='alert alert-info'>
          <span>
            Remixing <strong>{initial.forkedFromTitle}</strong> — tweak anything
            and publish your own version. The lineage stays linked.
          </span>
        </div>
      )}
      {initial?.banner && (
        <div className='alert alert-info'>
          <span>{initial.banner}</span>
        </div>
      )}
      {initial?.forkedFromId && (
        <input type='hidden' name='forkedFromId' value={initial.forkedFromId} />
      )}
      {initial?.originalCardUrl && (
        <>
          <input
            type='hidden'
            name='originalCardUrl'
            value={initial.originalCardUrl}
          />
          <figure className='max-w-xs'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initial.originalCardUrl}
              alt='Scanned recipe card'
              className='rounded-box border border-base-300'
            />
            <figcaption className='text-xs text-base-content/60 mt-1'>
              The original card will be kept on the recipe.
            </figcaption>
          </figure>
        </>
      )}

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>The basics</h2>
        <label className='form-control w-full'>
          <span className='label-text mb-1'>Title *</span>
          <input
            name='title'
            required
            maxLength={120}
            defaultValue={initial?.title}
            placeholder="Grandma Ruth's Æbleskiver"
            className='input input-bordered w-full'
          />
        </label>
        <label className='form-control w-full'>
          <span className='label-text mb-1'>Short description</span>
          <input
            name='description'
            maxLength={500}
            defaultValue={initial?.description}
            placeholder='Fluffy Danish pancake balls, best with lingonberry jam'
            className='input input-bordered w-full'
          />
        </label>
        <label className='form-control w-full'>
          <span className='label-text mb-1'>The story behind it</span>
          <textarea
            name='story'
            rows={3}
            maxLength={5000}
            defaultValue={initial?.story}
            placeholder='Where did this recipe come from? Who made it first?'
            className='textarea textarea-bordered w-full'
          />
        </label>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <label className='form-control'>
            <span className='label-text mb-1'>Servings *</span>
            <input
              name='servings'
              type='number'
              min={1}
              max={100}
              defaultValue={initial?.servings ?? 4}
              required
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Prep (min)</span>
            <input
              name='prepMin'
              type='number'
              min={0}
              defaultValue={initial?.prepMin ?? undefined}
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Cook (min)</span>
            <input
              name='cookMin'
              type='number'
              min={0}
              defaultValue={initial?.cookMin ?? undefined}
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Difficulty</span>
            <select
              name='difficulty'
              defaultValue={initial?.difficulty ?? 'MEDIUM'}
              className='select select-bordered'
            >
              <option value='EASY'>Easy</option>
              <option value='MEDIUM'>Medium</option>
              <option value='HARD'>Hard</option>
            </select>
          </label>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <label className='form-control'>
            <span className='label-text mb-1'>Cuisine</span>
            <input
              name='cuisine'
              maxLength={60}
              defaultValue={initial?.cuisine}
              placeholder='Danish'
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Tags (comma separated)</span>
            <input
              name='tags'
              defaultValue={initial?.tags}
              placeholder='breakfast, holiday, heirloom'
              className='input input-bordered'
            />
          </label>
        </div>
      </section>

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>Heritage</h2>
        <p className='text-sm text-base-content/60 -mt-2'>
          Where does this recipe really come from? Optional, but this is what
          your grandkids will want to know.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <label className='form-control'>
            <span className='label-text mb-1'>Original cook</span>
            <input
              name='originalAuthor'
              maxLength={80}
              defaultValue={initial?.originalAuthor}
              placeholder='Grandma Ruth'
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Era</span>
            <input
              name='originEra'
              maxLength={40}
              defaultValue={initial?.originEra}
              placeholder='1960s'
              className='input input-bordered'
            />
          </label>
          <label className='form-control'>
            <span className='label-text mb-1'>Place</span>
            <input
              name='originPlace'
              maxLength={80}
              defaultValue={initial?.originPlace}
              placeholder='Ballard, WA'
              className='input input-bordered'
            />
          </label>
        </div>
        {families.length > 0 && (
          <label className='form-control w-full max-w-xs'>
            <span className='label-text mb-1'>Family cookbook</span>
            <select
              name='familyId'
              defaultValue=''
              className='select select-bordered'
            >
              <option value=''>Not part of a family cookbook</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className='form-control w-full'>
          <span className='label-text mb-1'>
            Voice note — someone telling the story or the technique
          </span>
          <input
            name='voiceNote'
            type='file'
            accept='audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,audio/wav'
            className='file-input file-input-bordered w-full'
          />
        </label>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Photos</h2>
        <input
          name='images'
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          multiple
          className='file-input file-input-bordered w-full'
        />
        <p className='text-sm text-base-content/60'>
          The first photo becomes the cover. JPEG/PNG/WebP/GIF, up to 8 MB each.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Ingredients *</h2>
        {ingredients.rows.map((row, i) => (
          <div key={row.key} className='flex gap-2 items-start'>
            <input
              name='ingredient-quantity'
              placeholder='1 1/2'
              defaultValue={initial?.ingredients[row.key]?.quantity}
              aria-label={`Ingredient ${i + 1} quantity`}
              className='input input-bordered w-20'
            />
            <input
              name='ingredient-unit'
              placeholder='cups'
              defaultValue={initial?.ingredients[row.key]?.unit}
              aria-label={`Ingredient ${i + 1} unit`}
              className='input input-bordered w-24'
            />
            <input
              name='ingredient-item'
              placeholder='all-purpose flour'
              defaultValue={initial?.ingredients[row.key]?.item}
              aria-label={`Ingredient ${i + 1} name`}
              className='input input-bordered flex-1'
            />
            <input
              name='ingredient-note'
              placeholder='sifted'
              defaultValue={initial?.ingredients[row.key]?.note}
              aria-label={`Ingredient ${i + 1} note`}
              className='input input-bordered w-28 hidden md:block'
            />
            <button
              type='button'
              className='btn btn-ghost btn-square'
              aria-label={`Remove ingredient ${i + 1}`}
              onClick={() => ingredients.remove(row.key)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type='button'
          className='btn btn-outline btn-sm'
          onClick={ingredients.add}
        >
          + Add ingredient
        </button>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Steps *</h2>
        {steps.rows.map((row, i) => (
          <div key={row.key} className='flex gap-2 items-start'>
            <span className='badge badge-neutral mt-3'>{i + 1}</span>
            <textarea
              name='step-text'
              rows={2}
              placeholder='Whisk the dry ingredients together…'
              defaultValue={initial?.steps[row.key]}
              aria-label={`Step ${i + 1}`}
              className='textarea textarea-bordered flex-1'
            />
            <button
              type='button'
              className='btn btn-ghost btn-square'
              aria-label={`Remove step ${i + 1}`}
              onClick={() => steps.remove(row.key)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type='button'
          className='btn btn-outline btn-sm'
          onClick={steps.add}
        >
          + Add step
        </button>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Who can see it?</h2>
        <select
          name='visibility'
          defaultValue='PUBLIC'
          className='select select-bordered w-full max-w-xs'
        >
          <option value='PUBLIC'>Public — anyone can see it</option>
          <option value='FAMILY'>Family — only your family groups</option>
          <option value='PRIVATE'>Private — only you</option>
        </select>
      </section>

      <button
        type='submit'
        disabled={pending}
        className='btn btn-primary btn-wide'
      >
        {pending ? 'Saving…' : 'Publish recipe'}
      </button>
    </form>
  )
}
