'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import SignupModal from './SignupModal'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const navLinks = [
    { href: '/features', label: 'Features' },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 sm:px-6 h-16 shadow-lg">
            <Link href="/" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              doxia
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={() => setIsSignupModalOpen(true)}
                className="px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold hover:opacity-90 transition-colors"
              >
                Get Early Access
              </button>
              <ThemeToggle />
            </div>

            <div className="md:hidden flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex flex-col space-y-1.5"
                aria-label="Toggle menu"
              >
                <span className={`w-6 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-6 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-6 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden mt-2 mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-4 space-y-3 shadow-lg">
              {navLinks.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setIsSignupModalOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
              >
                Get Early Access
              </button>
            </div>
          )}
        </div>
      </nav>

      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </>
  )
}

