import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <span className="text-lg font-semibold">doxia</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            AI medical scribe
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link
            href="/privacy"
            className="text-slate-600 dark:text-slate-400 hover:text-[#0052CC] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-slate-600 dark:text-slate-400 hover:text-[#0052CC] transition-colors"
          >
            Terms of Service
          </Link>
        </div>
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Doxia.
        </p>
      </div>
    </footer>
  );
}
