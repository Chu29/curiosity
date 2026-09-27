'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MarginRail } from '../../../../components/navigation/margin-rail';
import { apiFetch } from '../../../../lib/api/client';
import type { ResearchGuideResponse, ResearchQuestionItem } from '@curiosity/types';

export default function ResearchGuidePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [guide, setGuide] = useState<ResearchGuideResponse | null>(null);
  const [questions, setQuestions] = useState<ResearchQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuide() {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<ResearchGuideResponse>(`/sessions/${sessionId}/research-guide`);
        setGuide(data);
        setQuestions(data.questions || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load research guide');
      } finally {
        setIsLoading(false);
      }
    }

    loadGuide();
  }, [sessionId]);

  const handleToggleQuestion = async (questionId: string, currentStatus: string) => {
    const isCompleted = currentStatus === 'COMPLETED';
    const action = isCompleted ? 'incomplete' : 'complete';

    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: isCompleted ? 'PENDING' : 'COMPLETED',
              completedAt: isCompleted ? null : new Date().toISOString(),
            }
          : q
      )
    );

    try {
      await apiFetch(`/research-questions/${questionId}/${action}`, {
        method: 'POST',
      });
    } catch {
      // Revert on failure
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                status: isCompleted ? 'COMPLETED' : 'PENDING',
                completedAt: isCompleted ? new Date().toISOString() : null,
              }
            : q
        )
      );
    }
  };

  const handleStartWorkspace = async () => {
    setIsStarting(true);
    setError(null);
    try {
      // Advance session state to RESEARCHING (Task 3.6)
      await apiFetch(`/sessions/${sessionId}/start`, {
        method: 'POST',
      });
      router.push(`/sessions/${sessionId}/research`);
    } catch {
      // If already started or researching, proceed to workspace
      router.push(`/sessions/${sessionId}/research`);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="GUIDE" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink">
          <div className="font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
            Formulating research guide...
          </div>
        </main>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-paper flex flex-col md:flex-row">
        <MarginRail currentStep="GUIDE" />
        <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink space-y-6">
          <h1 className="font-serif text-2xl font-semibold text-danger">Research Guide Unavailable</h1>
          <p className="text-sm text-ink-soft">{error || 'Guide could not be found.'}</p>
        </main>
      </div>
    );
  }

  const parsed = guide.parsedRequirements;

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <MarginRail currentStep="GUIDE" />

      <main className="flex-1 max-w-[680px] px-6 py-12 md:py-24 text-ink space-y-12">
        <header className="border-b border-rule pb-6">
          <div className="text-xs uppercase font-mono tracking-wider text-ink-soft mb-2">
            Structured Investigation Plan
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink">
            Research Guide
          </h1>
        </header>

        {/* Section 1: Objective */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">1.</span>
            Research Objective
          </h2>
          <p className="text-base text-ink leading-relaxed font-sans">
            {guide.objective}
          </p>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 2: Research Questions */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">2.</span>
            Research Questions
          </h2>
          <p className="text-xs text-ink-soft">
            Address each question during your investigation. Check items as you uncover evidence.
          </p>
          <div className="space-y-3 pt-2">
            {questions.map((q) => {
              const isDone = q.status === 'COMPLETED';
              return (
                <label
                  key={q.id}
                  className="flex items-start gap-3.5 p-3 rounded hover:bg-paper-raised/60 cursor-pointer transition-colors border border-transparent hover:border-rule"
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleQuestion(q.id, q.status)}
                    className="mt-1 h-4 w-4 rounded border-rule-strong text-accent focus:ring-focus cursor-pointer"
                  />
                  <span className={`text-sm leading-relaxed ${isDone ? 'line-through text-ink-soft' : 'text-ink'}`}>
                    {q.question}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 3: Concepts to Understand */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">3.</span>
            Concepts to Understand
          </h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {parsed?.concepts?.map((concept, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-paper-raised border border-rule text-xs font-mono text-ink rounded"
              >
                {concept}
              </span>
            )) || <span className="text-xs text-ink-soft">Core domain mechanisms</span>}
          </div>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 4: Suggested Source Types */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">4.</span>
            Suggested Source Types
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-ink-soft">
            {parsed?.suggestedSourceTypes?.map((st, idx) => (
              <li key={idx}>{st}</li>
            )) || (
              <>
                <li>Peer-reviewed publications and journals</li>
                <li>University course materials</li>
                <li>Technical documentation</li>
              </>
            )}
          </ul>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 5: Suggested Research Platforms */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">5.</span>
            Suggested Research Platforms
          </h2>
          <div className="flex flex-wrap gap-3 pt-1">
            {parsed?.suggestedPlatforms?.map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-paper-raised border border-rule hover:border-rule-strong text-xs font-medium text-ink rounded shadow-sm transition-colors"
              >
                <span>{p.name}</span>
                <span className="text-ink-soft text-[10px]">↗</span>
              </a>
            ))}
          </div>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 6: Research Checklist */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">6.</span>
            Research Checklist
          </h2>
          <ul className="space-y-2 text-sm text-ink">
            {parsed?.checklist?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-accent font-bold">›</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-b border-rule w-full" />

        {/* Section 7: Presentation Requirements */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
            <span className="text-accent font-mono font-bold text-base">7.</span>
            Presentation Requirements
          </h2>
          <div className="p-4 bg-paper-raised border border-rule rounded space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
              Target Duration: ~{parsed?.timeLimitMinutes || 5} minutes
            </div>
            {parsed?.requiredCoverage && parsed.requiredCoverage.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-ink">Required Topic Coverage:</div>
                <ul className="list-disc list-inside space-y-1 text-xs text-ink-soft">
                  {parsed.requiredCoverage.map((cov, idx) => (
                    <li key={idx}>{cov}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-6 border-t border-rule flex items-center justify-between">
          <button
            onClick={handleStartWorkspace}
            disabled={isStarting}
            className="py-3.5 px-8 bg-accent text-accent-ink hover:brightness-95 font-semibold text-base rounded shadow-sm transition-all disabled:opacity-50"
          >
            {isStarting ? 'Entering Workspace...' : 'Start Research'}
          </button>
        </div>
      </main>
    </div>
  );
}
