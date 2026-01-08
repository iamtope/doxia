'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MicrophoneIcon, SparklesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import DashboardPreview from './components/DashboardPreview'

export default function Home() {

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-12 px-4 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 -top-24 h-72 w-72 bg-[#0052CC]/20 blur-3xl rounded-full" />
            <div className="absolute right-0 top-10 h-96 w-96 bg-indigo-400/10 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-40" />
          </div>
          <div className="max-w-7xl mx-auto relative text-center space-y-8">
            <motion.div
              className="space-y-6 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="pill w-fit mx-auto">
                <SparklesIcon className="h-4 w-4 text-[#0052CC]" />
                <span className="text-slate-500">HIPAA & GDPR Compliant</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-700 dark:text-slate-200 font-semibold">Ambient AI Scribe</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                Medical notes that feel like <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052CC] to-indigo-500">Apple-level magic.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Transform patient conversations into structured SOAP notes instantly. Save 2 hours of charting every day and deliver patient-first care.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-[#0052CC] to-indigo-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-[0_20px_60px_-25px_rgba(0,82,204,0.7)] hover:shadow-[0_25px_70px_-30px_rgba(0,82,204,0.8)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Lifetime Access - $4.99
                </Link>
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  Zero subscriptions. Lifetime updates.
                </span>
              </div>
            </motion.div>

            {/* In-action Graphics */}
            <DashboardPreview />
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="pill text-sm font-semibold text-slate-600 dark:text-slate-200">Trusted by Individual Practitioners</div>
              <div className="pill text-sm font-semibold text-slate-600 dark:text-slate-200">HIPAA & GDPR Compliant</div>
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
                  title: 'Generate Reports',
                  body: 'Instantly generate reports in your preferred template format (e.g., SOAP, DAP, or custom letters).',
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
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <motion.div
              className="space-y-4 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div className="pill w-fit mx-auto text-rose-500 bg-rose-500/5 border-rose-500/10">The Documentation Burden</div>
              <h3 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-slate-100">
                Stop charting after hours.
              </h3>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Most doctors spend 2 hours on paperwork for every 1 hour of patient care. Doxia flips the script, automating your clinical documentation with ambient AI that understands medical context.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Ambient Listening", text: "Capture natural dialogue without a keyboard in the way." },
                { title: "Multi-Template Support", text: "Generate reports in SOAP, DAP, BIRP, or custom letter formats." },
                { title: "Team Collaboration", text: "Share notes securely and streamline multi-provider care." },
                { title: "Local & Multi-Lingual", text: "Optimized for regional accents and multiple languages." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="card p-6 text-left space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Differentiators Section */}
        <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-10">
              Why Doxia is built differently
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Specialty-Specific Templates', body: 'Go beyond SOAP. Create and use custom templates for DAP, BIRP, or any clinical letterhead format you prefer.' },
                { title: 'Clinical Team Sync', body: 'Securely collaborate with assistants and other providers. Assign tasks and share finalized reports in one click.' },
                { title: 'Edge-AI Speed', body: 'No waiting. Our local processing and edge-computing ensure your report is ready seconds after you stop recording.' },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  className="card p-8 shadow-lg hover:-translate-y-1 transition-transform text-left border-slate-200/60 dark:border-slate-800/60"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.08 }}
                >
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{item.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <div className="pill w-fit mx-auto mb-4">Security & Trust</div>
              <h3 className="text-4xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Common Questions
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Everything you need to know about Doxia's security, privacy, and workflow.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "How does Doxia ensure HIPAA compliance?",
                  a: "Doxia is built with a 'Privacy by Design' approach. We use AES-256 bank-grade encryption for all data, sign Business Associate Agreements (BAA) with our infrastructure partners, and maintain a strict zero-audio-retention policy—meaning audio is processed in real-time and never saved to a disk.",
                },
                {
                  q: "How does Doxia ensure GDPR compliance?",
                  a: "We comply with GDPR by ensuring all data processing has a clear legal basis, providing 'Right to be Forgotten' tools, and using data processing centers that meet EU privacy standards. Our end-to-end encryption ensures that even we cannot access sensitive patient information.",
                },
                {
                  q: "Does Doxia share my data with anyone?",
                  a: "Never. Your data is yours. We do not sell, trade, or share clinician or patient data with third parties for marketing or any other purposes. Data is only used to generate your specific reports.",
                },
                {
                  q: "Do you encrypt data at rest?",
                  a: "Yes. While we minimize data storage, any information that must be persisted (like your account settings) is encrypted using industry-standard AES-256 encryption at rest and TLS 1.3 in transit.",
                },
                {
                  q: "What happens to my data if I delete my account?",
                  a: "If you delete your account, all associated data is immediately and permanently purged from our active databases and eventually cleared from encrypted backups, satisfying your 'Right to Erasure'.",
                },
                {
                  q: "Does Doxia store payment details?",
                  a: "No. All payments are processed securely via RevenueCat and Stripe. We never see or store your credit card or billing information on our servers.",
                },
                {
                  q: "What if I have a security concern?",
                  a: "We take security reports seriously. You can reach our security team directly via the support link in your dashboard for immediate assistance and disclosure.",
                },
              ].map((item, idx) => (
                <details
                  key={idx}
                  className="group card overflow-hidden border-slate-200/60 dark:border-slate-800/60 transition-all duration-300"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 pr-4">
                      {item.q}
                    </span>
                    <div className="relative flex-shrink-0 w-6 h-6 transition-transform duration-300 group-open:rotate-180">
                      <span className="absolute inset-0 m-auto w-4 h-0.5 bg-slate-400 rounded-full" />
                      <span className="absolute inset-0 m-auto h-4 w-0.5 bg-slate-400 rounded-full group-open:opacity-0 transition-opacity" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/50 pt-4">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final Recap CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-[#0052CC] to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-semibold">Lifetime access. One price. Less paperwork, more patients.</h3>
            <p className="text-lg text-white/80">
              Ambient listening, instant SOAP, HIPAA & GDPR compliance, and copy-paste EHR flow. Pay once—no subscriptions.
            </p>
            <Link
              href="/signup"
              className="bg-white text-slate-900 px-10 py-4 rounded-full text-xl font-semibold hover:bg-slate-100 transition-colors shadow-2xl inline-block"
            >
              Get Early Access – $4.99
            </Link>
            <p className="text-sm text-white/70">30-day money-back guarantee. Early access slots are limited.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

