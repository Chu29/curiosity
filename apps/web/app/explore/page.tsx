'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarginRail } from '../../components/navigation/margin-rail';
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
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <MarginRail currentStep="DISCOVER" />

      <main className="flex-1 max-w-2xl px-6 md:px-12 py-12 md:py-24">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink">
          Discover a Topic
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Generate an unexpected, evidence-grounded research challenge in science and technology.
        </p>

        <div className="my-8 border-b border-rule w-full" />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col items-start gap-6">
          <button
            onClick={handleDiscover}
            disabled={isLoading}
            className="w-full sm:w-auto py-3.5 px-8 bg-accent text-accent-ink hover:brightness-95 font-semibold text-base rounded shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? 'Selecting topic...' : '⟳ Surprise Me'}
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-ink-soft hover:text-ink underline transition-colors"
          >
            {showFilters ? 'Hide filters' : 'Refine difficulty (optional)'}
          </button>

          {showFilters && (
            <div className="w-full p-4 bg-paper-raised border border-rule rounded space-y-3">
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
      </main>
    </div>
  );
}
