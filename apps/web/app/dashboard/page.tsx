'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/auth-context';

export default function DashboardPage() {
  const { user, guest, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500 font-medium">Loading session...</div>
      </div>
    );
  }

  if (!user && !guest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-gray-500 mb-6">
            You must be signed in or have an active guest session to view the learning dashboard.
          </p>
          <Link
            href="/auth"
            className="inline-block py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
          <p className="text-sm text-gray-500">
            {user ? 'Authenticated Learner Profile' : 'Guest Session Active'}
          </p>
        </div>
        <button
          onClick={logout}
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="mt-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
          {user ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-gray-800">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800">{user.email}</span>
              </div>
              {user.name && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{user.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Member Since</span>
                <span className="text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Guest ID</span>
                <span className="font-mono text-gray-800">{guest?.guestId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Session Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active (Temporary)
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Expires At</span>
                <span className="text-gray-800">
                  {guest?.expiresAt ? new Date(guest.expiresAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Phase 2 Verification Complete</h3>
          <p className="text-sm text-blue-700">
            Authentication and identity boundaries are operational. In Phase 3, topic generation and session lifecycle state machines will be enabled.
          </p>
        </div>
      </main>
    </div>
  );
}
