import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-4">
          Science &amp; Technology MVP
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Curiosity
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Research, present, and receive evidence-grounded feedback on deep science &amp; technology concepts.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth"
            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            Sign In / Get Started
          </Link>
          <Link
            href="/dashboard"
            className="py-3 px-6 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
