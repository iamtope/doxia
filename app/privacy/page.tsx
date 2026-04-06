import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              Privacy Policy
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Your privacy and data security are our top priorities
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-white dark:bg-slate-900">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Privacy &amp; Data Handling
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Doxia is built with privacy-first architecture. Audio is processed in real-time and never persisted to disk. We apply PII scrubbing to all transcript data. We are actively working toward formal HIPAA compliance and will announce when formal certifications are achieved.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Data Collection
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              We collect minimal information necessary to provide our service. This includes account information (name, email) and optional clinic information. We do not store audio recordings or patient data.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Data Security
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have questions about our privacy practices, please contact us.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

