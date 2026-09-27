'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarginRail } from '../../../components/navigation/margin-rail';
import { useAuth } from '../../../lib/auth/auth-context';
import { apiFetch } from '../../../lib/api/client';

interface TopicDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  estimatedResearchMinutes: number;
}

export default function TopicOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, guest, accessToken } = useAuth();
  const topicId = params?.id as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopic() {
      if (!topicId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<TopicDetail>(`/topics/${topicId}`);
        setTopic(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load topic details');
      } finally {
        setIsLoading(false);
      }
    }

    loadTopic();
  }, [topicId]);

  const handleStartResearch = async () => {
    setIsStarting(true);
    setError(null);

    try {
      let currentGuest = guest;

      // If user is not authenticated and has no active guest session, initiate guest session
      if (!accessToken && !currentGuest) {
        const guestRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/guest`,
          { method: 'POST' }
        );
        if (guestRes.ok) {
          currentGuest = await guestRes.json();
          localStorage.setItem('curiosity_guest_session', JSON.stringify(currentGuest));
        }
      }

      // 1. Create session (Task 3.4)
      const session = await apiFetch<{ id: string; status: string }>(`/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          topicId: topic?.id,
          guestToken: currentGuest?.guestToken,
        }),
      });

      // 2. Generate research guide (Task 4.2)
      await apiFetch(`/sessions/${session.id}/research-guide`, {
        method: 'POST',
      });

      localStorage.setItem('curiosity_active_session', session.id);
      // Route to Screen 4: Research Guide
      router.push(`/sessions/${session.id}/guide`);
    } catch (err: any) {
      setError(err.message || 'Failed to start research session');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="OVERVIEW" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink">
          <div className="font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
            Loading topic brief...
          </div>
        </main>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="OVERVIEW" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink space-y-6">
          <h1 className="font-serif text-2xl font-semibold text-danger">Topic Unavailable</h1>
          <p className="text-sm text-ink-soft">{error || 'Topic could not be found.'}</p>
          <div>
            <Link
              href="/explore"
              className="py-2.5 px-5 bg-paper-raised border border-rule font-medium text-sm rounded shadow-sm hover:border-rule-strong"
            >
              Back to Topic Discovery
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <MarginRail currentStep="OVERVIEW" />

      <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink">
        <div className="text-xs uppercase font-mono tracking-wider text-ink-soft mb-3">
          Science & Technology › {topic.subcategory || 'General'}
        </div>

        <h1 className="font-serif text-2xl md:text-4xl font-semibold text-ink leading-snug">
          {topic.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-xs text-ink-soft font-mono">
          <span className="uppercase tracking-wider font-semibold text-ink">
            {topic.difficulty}
          </span>
          <span>·</span>
          <span>~{topic.estimatedResearchMinutes} min estimated research</span>
        </div>

        <div className="my-8 border-b border-rule w-full" />

        {/* Assignment Brief */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-ink-soft">
            Mission Objective
          </h2>
          <p className="text-base sm:text-lg text-ink leading-relaxed">
            {topic.description}
          </p>
          <p className="text-sm text-ink-soft leading-normal">
            You will research this concept, document your evidence and sources, and prepare to explain it clearly from memory in presentation mode.
          </p>
        </section>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleStartResearch}
            disabled={isStarting}
            className="w-full sm:w-auto py-3.5 px-8 bg-accent text-accent-ink hover:brightness-95 font-semibold text-base rounded shadow-sm transition-all disabled:opacity-50"
          >
            {isStarting ? 'Generating Research Guide...' : 'Start Research'}
          </button>

          <Link
            href="/explore"
            className="text-xs text-ink-soft hover:text-ink underline transition-colors"
          >
            Choose a different topic
          </Link>
        </div>
      </main>
    </div>
  );
}
