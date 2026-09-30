'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { Button, ErrorState, LoadingState, TextLink } from '../../components/ui';

export default function AuthPage() {
  const { login, register, continueAsGuest, isLoading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await continueAsGuest();
    } catch (err: any) {
      setError(err.message || 'Failed to start guest session');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="page-container" style={{ margin: '0 auto' }}><LoadingState message="Restoring your session…" /></div>
    );
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh' }}><main className="page-container" style={{ margin: 'auto', width: 'min(440px, calc(100vw - 32px))' }}>
      <div className="screen-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="screen-description">
            {isLogin
              ? 'Enter your credentials to access your research'
              : 'Start your science & technology research journey'}
          </p>
        </div>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} className="content-section">
          {!isLogin && (
            <div className="content-section">
              <label className="screen-eyebrow">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full"
              />
            </div>
          )}

          <div className="content-section">
            <label className="screen-eyebrow">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="w-full"
            />
          </div>

          <div className="content-section">
            <label className="screen-eyebrow">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full"
            />
            {!isLogin && (
              <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">Or</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGuest}
          disabled={isSubmitting}
          variant="secondary"
        >
          Continue as Guest
        </Button>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="text-link"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-link"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </main></div>
  );
}
