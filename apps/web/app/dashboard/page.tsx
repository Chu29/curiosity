'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/auth-context';
import { AppShell } from '../../components/layout/app-shell';
import { Button, ErrorState, LoadingState, MetadataRow, PageTitle, StatusBadge, TextLink } from '../../components/ui';

export default function DashboardPage() {
  const { user, guest, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container" style={{ margin: '0 auto' }}><LoadingState message="Restoring your session…" /></div>
    );
  }

  if (!user && !guest) {
    return (
      <div className="page-container" style={{ margin: '0 auto' }}><ErrorState title="Access restricted" message="Sign in or start a guest session to view the learning dashboard." action={<TextLink href="/auth">Go to sign in</TextLink>} /></div>
    );
  }

  return (
    <AppShell step="DISCOVER">
      <header className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 32, lineHeight: '40px' }}>Learning dashboard</h1>
          <p className="screen-description">
            {user ? 'Authenticated Learner Profile' : 'Guest Session Active'}
          </p>
        </div>
        <Button variant="secondary"
          onClick={logout}
        >
          Sign Out
        </Button>
      </header>

      <main className="content-section">
        <div className="instrument-panel">
          <h2 className="section-title">Session details</h2>
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

        <div className="instrument-panel">
          <h3 className="section-title" style={{ fontSize: 20, lineHeight: '28px' }}>Identity session</h3>
          <p className="screen-description">
            Authentication and identity boundaries are operational. In Phase 3, topic generation and session lifecycle state machines will be enabled.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
