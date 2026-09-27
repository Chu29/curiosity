'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarginRail } from '../../../../components/navigation/margin-rail';
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
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="RESEARCH" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink">
          <div className="font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
            Loading presentation brief...
          </div>
        </main>
      </div>
    );
  }

  if (error && !guide) {
    return (
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="RESEARCH" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink space-y-6">
          <h1 className="font-serif text-2xl font-semibold text-danger">Brief Unavailable</h1>
          <p className="text-sm text-ink-soft">{error}</p>
        </main>
      </div>
    );
  }

  const parsed = guide?.parsedRequirements;
  const completedQuestions = questions.filter((q) => q.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <MarginRail currentStep="RESEARCH" />

      <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink space-y-8">
        <header className="border-b border-rule pb-6">
          <div className="text-xs uppercase font-mono tracking-wider text-ink-soft mb-2">
            Pre-Presentation Checklist & Brief
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink">
            Ready to Present?
          </h1>
        </header>

        {/* Presentation Guidelines */}
        <section className="space-y-4">
          <div className="p-5 bg-paper-raised border border-rule space-y-3">
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
        <div className="p-5 bg-paper-raised border-2 border-partial rounded space-y-2">
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
          <div className="bg-paper-raised border border-rule p-4 space-y-2">
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
          <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-700 rounded">
            {error}
          </div>
        )}

        {isReady ? (
          <div className="p-6 bg-paper-raised border border-supported rounded space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-supported" />
              <h4 className="text-sm font-semibold text-ink">Session State: READY_TO_PRESENT</h4>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Your research phase is marked complete. Phase 5 (Presentation Mode) will provide the microphone recording interface.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <Link
                href={`/sessions/${sessionId}/research`}
                className="text-xs text-ink-soft hover:text-ink underline transition-colors"
              >
                ← Return to Research Workspace
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-rule flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleReadyToPresent}
              disabled={isTransitioning}
              className="w-full sm:w-auto py-3.5 px-8 bg-accent text-accent-ink hover:brightness-95 font-semibold text-base rounded shadow-sm transition-all disabled:opacity-50"
            >
              {isTransitioning ? 'Updating session...' : 'Complete Research & Ready to Present'}
            </button>

            <Link
              href={`/sessions/${sessionId}/research`}
              className="text-xs text-ink-soft hover:text-ink underline transition-colors"
            >
              Back to workspace
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
