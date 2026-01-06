'use client'

import { useState, FormEvent } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    alert('Beta - Coming Soon!\n\nWe\'re putting the finishing touches on Doxia. Sign up to be notified when we launch!')
    setFormData({ email: '', password: '' })
    onClose()
  }

  const handleGoogleLogin = () => {
    alert('Beta - Coming Soon!\n\nGoogle login will be available when we launch!')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-800/80 rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-12 -top-16 h-28 bg-gradient-to-r from-[#0052CC] to-indigo-500 opacity-40 blur-3xl rounded-full pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-3xl font-light text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
          Log In
        </h2>

        <div className="bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 p-6 rounded-xl mb-6 text-center">
          <h3 className="text-xl font-semibold text-[#0052CC] mb-2">Beta - Coming Soon</h3>
          <p className="text-slate-600 dark:text-slate-400">
            We're putting the finishing touches on Doxia. Sign up to be notified when we launch!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>

          <button
            type="submit"
          className="w-full bg-gradient-to-r from-[#0052CC] to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-[0_20px_60px_-30px_rgba(0,82,204,0.8)] transition-all"
          >
            Log In
          </button>


          <button
            type="button"
            onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-medium hover:border-[#0052CC] transition-colors bg-white/70 dark:bg-slate-900/70"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Log in with Google
          </button>
        </form>
      </div>
    </div>
  )
}

