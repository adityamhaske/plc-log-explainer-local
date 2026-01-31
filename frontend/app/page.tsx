import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-white">PLC Fault Explainer</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-slate-300 hover:text-white px-3 py-2">
                Home
              </Link>
              <Link href="/workflow" className="text-slate-300 hover:text-white px-3 py-2">
                Analyzer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Industrial Fault Analysis System
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Advanced AI-powered system for diagnosing PLC faults. Upload logs, ask questions, and receive expert-level explanations in seconds.
          </p>
          <Link
            href="/workflow"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">Hybrid Search</h3>
            <p className="text-slate-400">
              Combines keyword and vector search for precise fault identification
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">Expert Analysis</h3>
            <p className="text-slate-400">
              AI-powered explanations with root cause hypotheses and action steps
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">Local & Secure</h3>
            <p className="text-slate-400">
              All processing happens locally, keeping your industrial data private
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
