'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SignupModal from '../components/SignupModal'

export default function Pricing() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const features = [
    'Unlimited scribing',
    'All future core updates',
    'Mobile + desktop access',
    'HIPAA compliant security',
    'Priority support',
  ]

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/4 -top-24 h-80 w-80 bg-indigo-400/20 blur-3xl rounded-full" />
            <div className="absolute right-0 top-10 h-96 w-96 bg-[#0052CC]/20 blur-3xl rounded-full" />
          </div>
          <motion.div
            className="relative max-w-4xl mx-auto text-center space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="pill mx-auto bg-white/10 border-white/20 text-white">The Founder’s Deal</div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Lifetime access for less than a coffee.
            </h1>
            <p className="text-xl text-slate-200">
              Pay once. Keep it forever. Includes every core update we ship.
            </p>
          </motion.div>
        </section>

        {/* Pricing Card */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-2xl p-10 md:p-14 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#0052CC]/15 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

              <div className="pill mx-auto mb-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
                One-time purchase
              </div>
              <h2 className="text-3xl font-semibold mb-4 text-slate-900 dark:text-slate-100">The Founder’s Deal</h2>
              <div className="flex items-start justify-center gap-2 mb-4">
                <span className="text-3xl font-semibold text-[#0052CC]">$</span>
                <span className="text-7xl font-bold text-[#0052CC] leading-none">4.99</span>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
                One-time payment for Lifetime Access
              </p>

              <div className="text-left space-y-3 mb-10">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <span className="h-3 w-3 rounded-full bg-[#0052CC]" />
                    <span className="text-lg text-slate-900 dark:text-slate-100">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsSignupModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#0052CC] to-indigo-500 text-white py-4 rounded-full text-xl font-semibold hover:shadow-[0_25px_70px_-30px_rgba(0,82,204,0.8)] transition-all duration-300 hover:-translate-y-0.5 mb-4"
              >
                Get Lifetime Access Now
              </button>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                Limited time offer. No recurring charges. Ever.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </>
  )
}

