'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth/auth-context';
import { Button } from '../components/ui';

export default function LandingPage() {
  const { user, guest, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between p-6 sm:p-12 relative">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="font-serif font-bold text-2xl text-ink tracking-tight">
          Curiosity
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft hidden sm:inline">
                {user.name || user.email}
              </span>
              <Button variant="secondary"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          ) : guest ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-soft font-mono bg-white px-2 py-1 rounded border border-rule">
                Guest active
              </span>
              <Link
                href="/auth"
                className="ui-button ui-button--secondary"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <Link
              href="/auth"
              className="ui-button ui-button--secondary"
            >
              Sign Up / Log In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl w-full mx-auto text-center my-auto py-12">
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-ink leading-tight sm:leading-snug">
          Turn curiosity into knowledge by researching and teaching what you learn.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-ink-soft font-medium">
          Science &amp; Technology
        </p>

        <div className="mt-10 flex flex-col items-center">
          <Link
            href="/explore"
            className="ui-button ui-button--primary"
          >
            Give Me a Topic
          </Link>

          <p className="mt-8 text-xs sm:text-sm text-ink-soft tracking-wide">
            Research &nbsp;→&nbsp; Present &nbsp;→&nbsp; Evaluate
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-ink-soft py-4 border-t border-rule">
        A disciplined research instrument for independent science &amp; technology inquiry.
      </footer>
    </div>
  );
}
