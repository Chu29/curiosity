'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/app-shell';
import { Button, Divider, ErrorState, LoadingState, PageTitle, ScreenActions, StatusBadge, TextLink } from '../../../../components/ui';
import { apiFetch } from '../../../../lib/api/client';
import type {
  ResearchGuideResponse,
  ResearchQuestionItem,
} from '@curiosity/types';

export default function PresentationBriefPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [guide, setGuide] = useState<ResearchGuideResponse | null>(null);
  const [questions, setQuestions] = useState<ResearchQuestionItem[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [guideData, sessionData] = await Promise.all([
          apiFetch<ResearchGuideResponse>(`/sessions/${sessionId}/research-guide`),
          apiFetch<{ id: string; status: string }>(`/sessions/${sessionId}`),
        ]);
        setGuide(guideData);
        setQuestions(guideData.questions || []);
        setSessionStatus(sessionData.status);
        if (sessionData.status === 'READY_TO_PRESENT') {
          setIsReady(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load presentation brief');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [sessionId]);

  const handleReadyToPresent = async () => {
    setIsTransitioning(true);
    setError(null);
    try {
      // Call session transition: RESEARCHING -> READY_TO_PRESENT (Task 4.7)
      const updated = await apiFetch<{ id: string; status: string }>(
        `/sessions/${sessionId}/ready-to-present`,
        { method: 'POST' }
      );
      setSessionStatus(updated.status);
      setIsReady(true);
    } catch (err: any) {
      setError(err.message || 'Failed to transition session to ready to present');
    } finally {
      setIsTransitioning(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell step="PRESENT"><LoadingState message="Loading presentation brief…" /></AppShell>
    );
  }

  if (error && !guide) {
    return (
      <AppShell step="PRESENT"><ErrorState title="Brief unavailable" message={error || 'The presentation brief could not be loaded.'} /></AppShell>
    );
  }

  const parsed = guide?.parsedRequirements;
  const completedQuestions = questions.filter((q) => q.status === 'COMPLETED');

  return (
    <AppShell step="PRESENT">
        <PageTitle eyebrow="Pre-presentation checklist" description="One short step remains before you explain the work from memory.">Ready to present?</PageTitle>

        {/* Presentation Guidelines */}
        <section className="space-y-4">
          <div className="instrument-panel">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-ink">
              Presentation Target Duration: ~{parsed?.timeLimitMinutes || 5} minutes
            </div>
            {parsed?.requiredCoverage && parsed.requiredCoverage.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-ink">Areas You Should Cover:</div>
                <ul className="list-disc list-inside space-y-1 text-xs text-ink-soft">
                  {parsed.requiredCoverage.map((cov, idx) => (
                    <li key={idx}>{cov}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Hidden Materials Warning Callout (rules-and-boundaries.md §2.2 & design spec Screen 6) */}
        <div className="instrument-panel" style={{ borderColor: 'var(--partial)' }}>
          <div className="flex items-center gap-2 text-partial font-semibold text-sm">
            <span className="text-base">⚠</span>
            <span>Your notes and sources will be hidden during Presentation Mode.</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed pl-6">
            In presentation mode, your notes, saved sources, and the research guide will be intentionally inaccessible.
            This platform tests your ability to explain concepts from memory and internal understanding.
          </p>
        </div>

        {/* Read-only Question Review */}
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-ink">
            Review Your Questions ({completedQuestions.length}/{questions.length} completed)
          </h3>
          <div className="instrument-panel">
            {questions.map((q) => {
              const isDone = q.status === 'COMPLETED';
              return (
                <div key={q.id} className="flex items-start gap-2.5 text-xs">
                  <span className={`font-bold font-mono ${isDone ? 'text-supported' : 'text-rule-strong'}`}>
                    {isDone ? '✓' : '○'}
                  </span>
                  <span className={isDone ? 'text-ink' : 'text-ink-soft'}>
                    {q.question}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {error && (
          <ErrorState title="Could not update the session" message={error} />
        )}

        {isReady ? (
          <div className="instrument-panel" style={{ borderColor: 'var(--supported)' }}>
            <div className="flex items-center gap-2">
              <StatusBadge label="Ready to present" tone="supported" />
              <h4 className="text-sm font-semibold text-ink">Session State: READY_TO_PRESENT</h4>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Your research phase is marked complete. Phase 5 (Presentation Mode) will provide the microphone recording interface.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <TextLink href={`/sessions/${sessionId}/research`}>← Return to research workspace</TextLink>
            </div>
          </div>
        ) : (
          <ScreenActions>
            <Button
              onClick={handleReadyToPresent}
              disabled={isTransitioning}
            >
              {isTransitioning ? 'Updating session…' : 'Start Presentation'}
            </Button>
            <TextLink href={`/sessions/${sessionId}/research`}>Back to workspace</TextLink>
          </ScreenActions>
        )}
    </AppShell>
  );
}
