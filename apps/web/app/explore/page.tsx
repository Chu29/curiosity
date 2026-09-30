'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/app-shell';
import { Button, ErrorState, PageTitle } from '../../components/ui';
import { useAuth } from '../../lib/auth/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function TopicDiscoveryPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [difficulty, setDifficulty] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE}/topics/random`);
      if (difficulty) {
        url.searchParams.set('difficulty', difficulty);
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        throw new Error('No topics found. Please adjust your criteria or try again.');
      }

      const topic = await res.json();
      router.push(`/topics/${topic.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to discover a topic');
      setIsLoading(false);
    }
  };

  return (
    <AppShell step="DISCOVER">
        <PageTitle eyebrow="Science & Technology" description="Generate an unexpected, evidence-grounded research challenge in science and technology.">Discover a topic</PageTitle>
        <div className="instrument-panel" style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
          Generate an unexpected, evidence-grounded research challenge in science and technology.
          </p>
        </div>

        {error && (
          <ErrorState message={error} />
        )}

        <div className="flex flex-col items-start gap-6">
          <Button
            onClick={handleDiscover}
            disabled={isLoading}
          >
            {isLoading ? 'Selecting topic…' : 'Give Me a Topic'}
          </Button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-ink-soft hover:text-ink underline transition-colors"
          >
            {showFilters ? 'Hide filters' : 'Refine difficulty (optional)'}
          </button>

          {showFilters && (
            <div className="instrument-panel" style={{ width: '100%', marginTop: 16 }}>
              <label className="block text-xs font-semibold uppercase text-ink-soft">
                Difficulty Level
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Any', value: '' },
                  { label: 'Beginner', value: 'BEGINNER' },
                  { label: 'Intermediate', value: 'INTERMEDIATE' },
                  { label: 'Advanced', value: 'ADVANCED' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`py-1.5 px-3 rounded text-xs font-medium border transition-colors ${
                      difficulty === opt.value
                        ? 'bg-accent text-accent-ink border-accent'
                        : 'bg-paper-raised text-ink border-rule hover:border-rule-strong'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </AppShell>
  );
}
