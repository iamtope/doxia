import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DashboardPreview from "./components/DashboardPreview";

const betaIncludes = [
  "Live Scribe — ambient recording to SOAP, DAP, BIRP, or custom templates",
  "Speaker diarization, ICD-10 suggestions, and patient summary",
  "Patient Notes history and template editor",
  "Copy to clipboard for any EHR; Epic/Cerner OAuth in Integrations",
  "PII scrubbing; audio not stored on disk",
  "Fair-use: 30 min per session, 2 hours total per account",
];

const steps = [
  {
    n: "01",
    title: "Record the visit",
    body: "Ambient capture during the encounter. No typing while the patient is in the room.",
  },
  {
    n: "02",
    title: "Review the note",
    body: "Structured output in SOAP, DAP, BIRP, or your own template. Edit sections before signing off.",
  },
  {
    n: "03",
    title: "Paste into your EHR",
    body: "One-click copy into Epic, Cerner, or any system. Direct push from scribe is on the roadmap.",
  },
];

const faqs = [
  {
    q: "How does Doxia handle patient privacy?",
    a: "Audio is processed in real time and not stored on disk. Transcripts go through PII scrubbing before persistence. We are working toward HIPAA compliance and BAAs.",
  },
  {
    q: "Is Doxia HIPAA compliant?",
    a: "Not yet. During beta we recommend synthetic or de-identified encounters only—not real patient PHI in production workflows.",
  },
  {
    q: "Is Doxia free?",
    a: "Yes during beta. No credit card. Usage is capped at 30 minutes per session and 2 hours total per account.",
  },
  {
    q: "Does Doxia share my data?",
    a: "No. We do not sell or share clinician or patient data for marketing or unrelated purposes.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Hero — editorial, left-aligned, no gradients/orbs */}
        <section className="border-b border-stone-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="space-y-8">
                <p className="text-sm font-medium text-[#0052CC] tracking-wide uppercase">
                  Open beta · Independent practice
                </p>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                  Ambient documentation for clinicians who still chart after
                  hours.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                  Doxia listens during the visit and drafts structured clinical
                  notes you can review and paste into your EHR—without the
                  generic AI scribe fluff.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-[#0052CC] text-white px-6 py-3 text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Start free beta
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/features"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-stone-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                  >
                    See what ships today
                  </Link>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  No credit card.{" "}
                  <Link href="/pricing" className="text-[#0052CC] hover:underline">
                    Beta limits
                  </Link>
                </p>
              </div>
              <div className="lg:pt-4">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Beta scope */}
        <section className="border-b border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-6">
              Included in beta
            </h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {betaIncludes.map((item) => (
                <li
                  key={item}
                  className="text-sm text-slate-700 dark:text-slate-300 pl-4 border-l-2 border-[#0052CC]/40"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works — numbered, no icon cards */}
        <section className="border-b border-stone-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-10">
              How it works
            </h2>
            <ol className="grid md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <li key={step.n} className="space-y-3">
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    {step.n}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Problem — single column, no pills */}
        <section className="border-b border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              The documentation burden
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Many clinicians spend as much time on notes as on visits. Doxia is
              built to cut that ratio: capture the conversation, generate a
              draft you control, and move on. Team sharing and in-EHR push are
              on the roadmap; copy-paste works today.
            </p>
            <ul className="mt-8 grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { title: "Ambient listening", text: "Hands on the patient, not the keyboard." },
                { title: "Your templates", text: "SOAP, DAP, BIRP, or custom formats." },
                { title: "Diarization", text: "Speaker labels when multiple voices are present." },
                { title: "Honest beta scope", text: "We label what is live vs. roadmap on Features." },
              ].map((item) => (
                <li
                  key={item.title}
                  className="p-4 border border-stone-200 dark:border-slate-800 bg-[#fafaf9] dark:bg-slate-950"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ — minimal */}
        <section className="border-b border-stone-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">
              Questions clinicians ask
            </h2>
            <dl className="divide-y divide-stone-200 dark:divide-slate-800">
              {faqs.map((item) => (
                <div key={item.q} className="py-6 first:pt-0">
                  <dt className="font-semibold text-slate-900 dark:text-white">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA — flat, no gradient band */}
        <section className="bg-[#0052CC] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold">
                Try Doxia on your next de-identified encounter.
              </h2>
              <p className="mt-2 text-white/80 text-sm max-w-md">
                Free during beta. You land in Live Scribe immediately after
                signup.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center justify-center bg-white text-[#0052CC] px-6 py-3 text-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              Create free account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
