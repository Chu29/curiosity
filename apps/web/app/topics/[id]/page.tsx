'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarginRail } from '../../../components/navigation/margin-rail';
import { useAuth } from '../../../lib/auth/auth-context';

interface TopicDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedResearchMinutes: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function TopicOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;
  const { user, guest, accessToken, continueAsGuest } = useAuth();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  useEffect(() => {
    async function loadTopic() {
      if (!topicId) return;
      try {
        const res = await fetch(`${API_BASE}/topics/${topicId}`);
        if (!res.ok) {
          throw new Error('Topic not found');
        }
        const data = await res.json();
        setTopic(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load topic');
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
        const guestRes = await fetch(`${API_BASE}/auth/guest`, { method: 'POST' });
        if (guestRes.ok) {
          currentGuest = await guestRes.json();
          localStorage.setItem('curiosity_guest_session', JSON.stringify(currentGuest));
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // 1. Create session (Task 3.4)
      const sessionRes = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topicId: topic?.id,
          guestToken: currentGuest?.guestToken,
        }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create learning session');
      }

      const session = await sessionRes.json();

      // 2. Start session (Task 3.6: transition CREATED -> RESEARCHING)
      const startRes = await fetch(`${API_BASE}/sessions/${session.id}/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          guestToken: currentGuest?.guestToken,
        }),
      });

      const startedSession = startRes.ok ? await startRes.json() : session;
      setActiveSession(startedSession);
      localStorage.setItem('curiosity_active_session', startedSession.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start research session');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm font-mono text-ink-soft">Loading mission brief...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
        <div className="max-w-md bg-paper-raised border border-rule p-8 rounded text-center">
          <h2 className="text-lg font-serif font-bold text-ink mb-2">Topic Not Found</h2>
          <p className="text-sm text-ink-soft mb-6">{error || 'Unable to retrieve this topic.'}</p>
          <Link
            href="/explore"
            className="py-2.5 px-6 bg-accent text-accent-ink font-semibold rounded text-sm hover:brightness-95"
          >
            Discover Another Topic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <MarginRail currentStep="OVERVIEW" />

      <main className="flex-1 max-w-2xl px-6 md:px-12 py-12 md:py-24">
        {/* Breadcrumb & Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft mb-3">
          <span>Science &amp; Technology</span>
          <span>›</span>
          <span className="font-medium text-ink">{topic.subcategory}</span>
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

        {activeSession ? (
          <div className="mt-10 p-6 bg-paper-raised border border-supported rounded space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-supported inline-block" />
              <h3 className="text-sm font-semibold text-ink">Learning Session Initialized</h3>
            </div>
            <div className="space-y-2 text-xs font-mono text-ink-soft">
              <div>Session ID: {activeSession.id}</div>
              <div>Status: <span className="text-supported font-bold">{activeSession.status}</span></div>
            </div>
            <p className="text-xs text-ink-soft pt-2 border-t border-rule">
              State machine transition (<code>CREATED → RESEARCHING</code>) complete. In Phase 4, the structured Research Workspace and Research Guide questions will be generated.
            </p>
          </div>
        ) : (
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleStartResearch}
              disabled={isStarting}
              className="w-full sm:w-auto py-3.5 px-8 bg-accent text-accent-ink hover:brightness-95 font-semibold text-base rounded shadow-sm transition-all disabled:opacity-50"
            >
              {isStarting ? 'Preparing session...' : 'Start Research'}
            </button>

            <Link
              href="/explore"
              className="text-xs text-ink-soft hover:text-ink underline transition-colors"
            >
              Choose a different topic
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
