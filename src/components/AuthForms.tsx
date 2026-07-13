'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, signup, type AuthFormState } from '@/app/actions/auth'

const initialState: AuthFormState = { error: null }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <form action={formAction} className='space-y-4'>
      {state.error && (
        <div role='alert' className='alert alert-error text-sm'>
          {state.error}
        </div>
      )}
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Email</span>
        <input
          name='email'
          type='email'
          required
          autoComplete='email'
          className='input input-bordered w-full'
        />
      </label>
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Password</span>
        <input
          name='password'
          type='password'
          required
          autoComplete='current-password'
          className='input input-bordered w-full'
        />
      </label>
      <button
        type='submit'
        disabled={pending}
        className='btn btn-primary w-full'
      >
        {pending ? 'Signing in…' : 'Login'}
      </button>
      <p className='text-sm text-center'>
        New here?{' '}
        <Link href='/signup' className='link link-primary'>
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <form action={formAction} className='space-y-4'>
      {state.error && (
        <div role='alert' className='alert alert-error text-sm'>
          {state.error}
        </div>
      )}
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Full name</span>
        <input
          name='name'
          required
          maxLength={80}
          autoComplete='name'
          className='input input-bordered w-full'
        />
      </label>
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Username</span>
        <input
          name='username'
          required
          minLength={3}
          maxLength={30}
          pattern='[A-Za-z0-9_]+'
          title='Letters, numbers, and underscores only'
          autoComplete='username'
          className='input input-bordered w-full'
        />
      </label>
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Email</span>
        <input
          name='email'
          type='email'
          required
          autoComplete='email'
          className='input input-bordered w-full'
        />
      </label>
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Password</span>
        <input
          name='password'
          type='password'
          required
          minLength={8}
          autoComplete='new-password'
          className='input input-bordered w-full'
        />
      </label>
      <button
        type='submit'
        disabled={pending}
        className='btn btn-primary w-full'
      >
        {pending ? 'Creating account…' : 'Sign Up'}
      </button>
      <p className='text-sm text-center'>
        Already have an account?{' '}
        <Link href='/login' className='link link-primary'>
          Login
        </Link>
      </p>
    </form>
  )
}
