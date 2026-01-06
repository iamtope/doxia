import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              Terms of Service
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Please read these terms carefully before using Doxia
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-white dark:bg-slate-900">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Acceptance of Terms
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              By accessing and using Doxia, you accept and agree to be bound by these Terms of Service.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Service Description
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Doxia provides AI-powered medical documentation services. The service is designed to assist healthcare providers in creating structured medical notes.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              User Responsibilities
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Users are responsible for reviewing and verifying all generated notes before use. Doxia is a tool to assist documentation and should not replace professional medical judgment.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Lifetime Access
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              The Founder's Deal provides lifetime access to core features. Future premium features may require additional payment.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have questions about these terms, please contact us.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

