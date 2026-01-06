'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MicrophoneIcon, SparklesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SignupModal from './components/SignupModal'

export default function Home() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 px-4 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 -top-24 h-72 w-72 bg-[#0052CC]/20 blur-3xl rounded-full" />
            <div className="absolute right-0 top-10 h-96 w-96 bg-indigo-400/10 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-40" />
          </div>
          <div className="max-w-7xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="pill w-fit">
                <SparklesIcon className="h-4 w-4 text-[#0052CC]" />
                <span className="text-slate-500">HIPAA Compliant</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-700 dark:text-slate-200 font-semibold">Ambient AI Scribe</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                Medical notes that feel like Apple-level magic.
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Transform patient conversations into structured SOAP notes instantly. Save 2 hours of charting every day and deliver patient-first care without the paperwork drag.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button
                  onClick={() => setIsSignupModalOpen(true)}
                  className="bg-gradient-to-r from-[#0052CC] to-indigo-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-[0_20px_60px_-25px_rgba(0,82,204,0.7)] hover:shadow-[0_25px_70px_-30px_rgba(0,82,204,0.8)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Lifetime Access - $4.99
                </button>
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  Zero subscriptions. Lifetime updates.
                </span>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.05 }}
            >
              <div className="absolute -inset-6 bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl rounded-3xl" />
              <div className="relative glass rounded-3xl p-6 shadow-2xl border border-white/50 dark:border-slate-800/50">
                <div className="flex items-center justify-between pb-4 border-b border-white/60 dark:border-slate-800/60">
                  <div className="pill">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Encounter</span>
                  </div>
                  <span className="text-sm text-slate-500">00:14:23</span>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-sky-400/10 border border-white/40 dark:border-slate-800/60 p-4 shadow-inner">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Subjective</div>
                    <div className="text-slate-900 dark:text-slate-100 font-semibold">
                      “I’ve felt short of breath during morning rounds, and my chest feels tight.”
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Objective</div>
                    <div className="text-slate-800 dark:text-slate-200">
                      HR 82 | BP 124/78 | O2 98% RA | Clear lung sounds | No edema
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Assessment</div>
                    <div className="text-slate-800 dark:text-slate-200">
                      Mild exertional dyspnea likely related to seasonal asthma flare-up.
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Plan</div>
                    <div className="text-slate-800 dark:text-slate-200">
                      Resume inhaled corticosteroid BID. Follow-up in 2 weeks. Provide spacer.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="pill text-sm font-semibold text-slate-600 dark:text-slate-200">Trusted by Individual Practitioners</div>
              <div className="pill text-sm font-semibold text-slate-600 dark:text-slate-200">HIPAA Compliant</div>
              <div className="pill text-sm font-semibold text-slate-600 dark:text-slate-200">Zero Audio Storage</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Users', value: '500+' },
                { label: 'Notes Generated', value: '50K+' },
                { label: 'Daily Time Saved', value: '2 hrs' },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  className="glass rounded-2xl p-8 text-center shadow-lg hover:-translate-y-1 transition-transform"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.08 }}
                >
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{item.value}</div>
                  <div className="text-slate-600 dark:text-slate-300">{item.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div
              className="max-w-3xl mx-auto glass p-8 rounded-2xl text-left shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">Testimonial</p>
              <p className="text-xl text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
                “Doxia turned 2 hours of nightly charting into 10 minutes. My notes are cleaner, my patients get more face time, and I’m not drowning after clinic.”
              </p>
              <p className="mt-3 text-sm text-slate-500">— Dr. L. Morales, Family Medicine</p>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-center mb-12 text-slate-900 dark:text-slate-100">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <MicrophoneIcon className="h-8 w-8 text-[#0052CC]" />,
                  title: 'Record Encounter',
                  body: 'Start ambient listening. We capture every word with clinic-grade accuracy.',
                },
                {
                  icon: <SparklesIcon className="h-8 w-8 text-[#0052CC]" />,
                  title: 'AI Generates SOAP',
                  body: 'Instantly structured Subjective, Objective, Assessment, Plan—no templates to fight.',
                },
                {
                  icon: <ClipboardDocumentListIcon className="h-8 w-8 text-[#0052CC]" />,
                  title: 'Sync to EHR',
                  body: 'Copy-paste into Epic, Cerner, or Athena. Zero friction, zero lock-in.',
                },
              ].map((step, idx) => (
                <motion.div
                  key={step.title}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col gap-3 hover:-translate-y-1 transition-transform"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.08 }}
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {step.icon}
                  </div>
                  <div className="text-sm text-slate-500">Step {idx + 1}</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem → Solution Section */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div className="pill w-fit">Your Pain</div>
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Charting after hours, messy notes, EHR copy-paste fatigue.
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Doxia listens in real time, writes SOAP for you, and keeps everything ready to drop into Epic, Cerner, or Athena—no integrations needed.
              </p>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                <li className="flex gap-3"><span className="text-[#0052CC] font-bold">•</span> 98%+ capture accuracy in busy clinics.</li>
                <li className="flex gap-3"><span className="text-[#0052CC] font-bold">•</span> Zero audio retention; HIPAA-first encryption.</li>
                <li className="flex gap-3"><span className="text-[#0052CC] font-bold">•</span> One-click SOAP output, ready for EHR paste.</li>
              </ul>
            </motion.div>
            <motion.div
              className="glass rounded-3xl p-6 shadow-2xl border border-white/50 dark:border-slate-800/50"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
            >
              <div className="text-sm text-slate-500 mb-3">Live Output</div>
              <div className="space-y-3">
                {['Subjective', 'Objective', 'Assessment', 'Plan'].map((heading) => (
                  <div key={heading} className="card p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{heading}</div>
                    <div className="text-slate-900 dark:text-slate-100">
                      {heading === 'Subjective' && '“Short of breath on rounds, chest tightness this week.”'}
                      {heading === 'Objective' && 'HR 82 | BP 124/78 | O2 98% RA | Lungs clear | No edema'}
                      {heading === 'Assessment' && 'Mild exertional dyspnea—likely seasonal asthma flare.'}
                      {heading === 'Plan' && 'Resume ICS BID, spacer provided, f/u in 2 weeks.'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Differentiators Section */}
        <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-semibold text-center text-slate-900 dark:text-slate-100 mb-10">
              Why Doxia beats generic “AI note” tools
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Ambient, clinic-ready', body: 'Built for overlapping voices and background noise—not just clean demos.' },
                { title: 'Copy/paste EHR flow', body: 'No integrations to break. SOAP arrives structured and ready to drop into Epic, Cerner, Athena.' },
                { title: 'Privacy-first', body: 'Zero audio storage. End-to-end encryption. HIPAA-first design.' },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  className="card p-6 shadow-lg hover:-translate-y-1 transition-transform"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.08 }}
                >
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl font-semibold text-center text-slate-900 dark:text-slate-100 mb-10">FAQs</h3>
            <div className="space-y-4">
              {[
                { q: 'Do you store audio?', a: 'No. Audio is processed in-session only; nothing is stored on our servers.' },
                { q: 'Will this work with my EHR?', a: 'Yes. We generate SOAP text you can paste into Epic, Cerner, Athena, or any EHR with a notes field.' },
                { q: 'Is it HIPAA compliant?', a: 'Yes. We use end-to-end encryption and keep zero audio retention by design.' },
                { q: 'What’s included for $4.99?', a: 'Lifetime access to ambient capture, SOAP formatting, updates to core features, and desktop + mobile access.' },
              ].map((item, idx) => (
                <motion.div
                  key={item.q}
                  className="card p-4 shadow-sm"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: idx * 0.04 }}
                >
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.q}</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-2">{item.a}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Recap CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-[#0052CC] to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-semibold">Lifetime access. One price. Less paperwork, more patients.</h3>
            <p className="text-lg text-white/80">
              Ambient listening, instant SOAP, HIPAA compliance, and copy-paste EHR flow. Pay once—no subscriptions.
            </p>
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="bg-white text-slate-900 px-10 py-4 rounded-full text-xl font-semibold hover:bg-slate-100 transition-colors shadow-2xl"
            >
              Get Early Access – $4.99
            </button>
            <p className="text-sm text-white/70">30-day money-back guarantee. Early access slots are limited.</p>
          </div>
        </section>
      </main>
      <Footer />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </>
  )
}

