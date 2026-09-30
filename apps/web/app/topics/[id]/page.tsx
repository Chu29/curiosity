'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/app-shell';
import { Button, Divider, ErrorState, LoadingState, MetadataRow, PageTitle, ScreenActions, TextLink } from '../../../components/ui';
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
      <AppShell step="OVERVIEW"><LoadingState message="Loading topic brief…" /></AppShell>
    );
  }

  if (error || !topic) {
    return (
      <AppShell step="OVERVIEW"><ErrorState title="Topic unavailable" message={error || 'Topic could not be found.'} action={<TextLink href="/explore">Back to topic discovery</TextLink>} /></AppShell>
    );
  }

  return (
    <AppShell step="OVERVIEW">
        <div className="text-xs uppercase font-mono tracking-wider text-ink-soft mb-3">
          Science & Technology › {topic.subcategory || 'General'}
        </div>

        <PageTitle eyebrow={`Science & Technology / ${topic.subcategory || 'General'}`}>{topic.title}</PageTitle>
        <MetadataRow items={[{ label: 'Difficulty', value: topic.difficulty }, { label: 'Estimated research', value: `~${topic.estimatedResearchMinutes} min` }]} />

        {/* Assignment Brief */}
        <section className="content-section">
          <h2 className="section-title">Mission objective</h2>
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

        <ScreenActions>
          <Button
            onClick={handleStartResearch}
            disabled={isStarting}
          >
            {isStarting ? 'Generating research guide…' : 'Start Research'}
          </Button>
          <TextLink href="/explore">Choose a different topic</TextLink>
        </ScreenActions>
    </AppShell>
  );
}
