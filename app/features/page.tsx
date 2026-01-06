'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MicrophoneIcon,
  Squares2X2Icon,
  ArrowPathRoundedSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SignupModal from '../components/SignupModal'

export default function Features() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const features = [
    {
      icon: <MicrophoneIcon className="h-9 w-9 text-[#0052CC]" />,
      title: 'Ambient Listening',
      description: 'High-accuracy capture even in noisy clinics. Built for overlapping voices, accents, and real-world chaos.',
    },
    {
      icon: <Squares2X2Icon className="h-9 w-9 text-[#0052CC]" />,
      title: 'Instant SOAP Formatting',
      description: 'Perfectly structured Subjective, Objective, Assessment, and Plan notes—no templates or macros to manage.',
    },
    {
      icon: <ArrowPathRoundedSquareIcon className="h-9 w-9 text-[#0052CC]" />,
      title: 'EHR Compatibility',
      description: 'Works alongside Epic, Cerner, and Athena via secure copy-paste. Seamless, secure, no integrations required.',
    },
    {
      icon: <ShieldCheckIcon className="h-9 w-9 text-[#0052CC]" />,
      title: 'Privacy-First Design',
      description: 'Zero audio storage and end-to-end encryption. HIPAA-grade security engineered in, not bolted on.',
    },
  ]

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20 px-4">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 -top-20 h-80 w-80 bg-indigo-400/15 blur-3xl rounded-full" />
            <div className="absolute right-0 top-10 h-72 w-72 bg-sky-300/20 blur-3xl rounded-full" />
          </div>
          <motion.div
            className="relative max-w-5xl mx-auto text-center space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="pill mx-auto text-sm font-semibold text-slate-600 dark:text-slate-200 w-fit">
              Designed for modern healthcare
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Features crafted to disappear into your workflow.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Apple-level polish with clinical precision—ambient listening, instant SOAP, and frictionless EHR handoff.
            </p>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-2xl p-8 flex flex-col gap-4 hover:-translate-y-1 transition-transform"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.08 }}
              >
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="pill mx-auto bg-white/10 border-white/20 text-white">Founder’s Deal</div>
            <h2 className="text-3xl md:text-4xl font-semibold">
              Ready to ship documentation that feels effortless?
            </h2>
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="bg-white text-slate-900 px-10 py-4 rounded-full text-xl font-semibold hover:bg-slate-100 transition-colors shadow-2xl"
            >
              Get Lifetime Access - $4.99
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </>
  )
}

