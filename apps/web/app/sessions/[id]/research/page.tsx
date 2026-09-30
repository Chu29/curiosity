'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/app-shell';
import { EmptyState, ErrorState, LoadingState, TextLink } from '../../../../components/ui';
import { apiFetch } from '../../../../lib/api/client';
import type {
  ResearchGuideResponse,
  ResearchQuestionItem,
  NoteItem,
  SourceItem,
  SourceType,
} from '@curiosity/types';

export default function ResearchWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [guide, setGuide] = useState<ResearchGuideResponse | null>(null);
  const [questions, setQuestions] = useState<ResearchQuestionItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Note Form State
  const [noteContent, setNoteContent] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // New Source Form State
  const [showAddSource, setShowAddSource] = useState<boolean>(false);
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [sourceAuthor, setSourceAuthor] = useState<string>('');
  const [sourceType, setSourceType] = useState<SourceType>('ARTICLE');
  const [sourceDesc, setSourceDesc] = useState<string>('');
  const [isSubmittingSource, setIsSubmittingSource] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [guideData, notesData, sourcesData] = await Promise.all([
        apiFetch<ResearchGuideResponse>(`/sessions/${sessionId}/research-guide`),
        apiFetch<NoteItem[]>(`/sessions/${sessionId}/notes`),
        apiFetch<SourceItem[]>(`/sessions/${sessionId}/sources`),
      ]);
      setGuide(guideData);
      setQuestions(guideData.questions || []);
      setNotes(notesData);
      setSources(sourcesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load research workspace');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleQuestion = async (questionId: string, currentStatus: string) => {
    const isCompleted = currentStatus === 'COMPLETED';
    const action = isCompleted ? 'incomplete' : 'complete';

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

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const newNote = await apiFetch<NoteItem>(`/sessions/${sessionId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: noteContent.trim(),
          researchQuestionId: selectedQuestionId || null,
          sourceIds: selectedSourceIds,
        }),
      });

      setNotes((prev) => [...prev, newNote]);
      setNoteContent('');
      setSelectedQuestionId('');
      setSelectedSourceIds([]);
    } catch (err: any) {
      alert(err.message || 'Failed to create note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiFetch(`/notes/${noteId}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim() || !sourceUrl.trim()) return;

    setIsSubmittingSource(true);
    try {
      const newSource = await apiFetch<SourceItem>(`/sessions/${sessionId}/sources`, {
        method: 'POST',
        body: JSON.stringify({
          title: sourceTitle.trim(),
          url: sourceUrl.trim(),
          authorOrganization: sourceAuthor.trim() || null,
          sourceType,
          description: sourceDesc.trim() || null,
        }),
      });

      setSources((prev) => [...prev, newSource]);
      setSourceTitle('');
      setSourceUrl('');
      setSourceAuthor('');
      setSourceDesc('');
      setShowAddSource(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create source');
    } finally {
      setIsSubmittingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    try {
      await apiFetch(`/sources/${sourceId}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      // Reload notes to refresh source associations
      const updatedNotes = await apiFetch<NoteItem[]>(`/sessions/${sessionId}/notes`);
      setNotes(updatedNotes);
    } catch (err: any) {
      alert(err.message || 'Failed to delete source');
    }
  };

  const completedQuestionsCount = questions.filter((q) => q.status === 'COMPLETED').length;

  if (isLoading) {
    return (
      <AppShell step="RESEARCH" wide><LoadingState message="Loading research workspace…" /></AppShell>
    );
  }

  if (error || !guide) {
    return (
      <AppShell step="RESEARCH" wide><ErrorState title="Workspace unavailable" message={error || 'Unable to load workspace.'} /></AppShell>
    );
  }

  return (
    <AppShell step="RESEARCH" wide>
        {/* Workspace Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rule gap-4">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-ink-soft mb-1">
              Independent Investigation
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
              Research Workspace
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-ink-soft">
              Progress:{' '}
              <span className="font-semibold text-ink">
                {completedQuestionsCount}/{questions.length} questions
              </span>
            </div>

            <TextLink
              href={`/sessions/${sessionId}/brief`}
              className="py-2.5 px-5 bg-paper-raised border border-rule-strong hover:border-ink font-semibold text-xs rounded transition-colors text-ink shadow-sm"
            >
              Proceed to Presentation Brief →
            </TextLink>
          </div>
        </header>

        {/* Two Column Layout: Questions & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
          {/* Left Column: Questions Checklist */}
          <section className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-ink-soft">
                Questions Checklist
              </h2>
              <span className="text-[11px] font-mono text-ink-soft">
                {completedQuestionsCount} of {questions.length} checked
              </span>
            </div>

            <div className="bg-paper-raised border border-rule p-4 space-y-3">
              {questions.map((q) => {
                const isDone = q.status === 'COMPLETED';
                return (
                  <label
                    key={q.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-paper cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleQuestion(q.id, q.status)}
                      className="mt-0.5 h-4 w-4 rounded border-rule-strong text-supported focus:ring-focus cursor-pointer"
                    />
                    <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-ink-soft' : 'text-ink'}`}>
                      {q.question}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Right Column: Research Notes */}
          <section className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-ink-soft">
                Research Notes
              </h2>
              <span className="text-[11px] font-mono text-ink-soft">
                {notes.length} saved notes
              </span>
            </div>

            {/* Note Creation Form */}
            <form onSubmit={handleCreateNote} className="p-4 bg-paper-raised border border-rule space-y-3">
              <div>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record your findings, facts, equations, and synthesis..."
                  rows={4}
                  required
                  className="w-full p-3 text-xs bg-paper border border-rule-strong rounded focus:border-focus focus:outline-none text-ink placeholder:text-ink-soft/60 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-ink-soft mb-1">
                    Related Question (optional)
                  </label>
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="w-full p-2 text-xs bg-paper border border-rule rounded text-ink focus:outline-none"
                  >
                    <option value="">-- No specific question --</option>
                    {questions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.question.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                {sources.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-mono text-ink-soft mb-1">
                      Informed by Sources
                    </label>
                    <div className="max-h-24 overflow-y-auto p-2 bg-paper border border-rule rounded space-y-1">
                      {sources.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-[11px] text-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSourceIds((prev) => [...prev, s.id]);
                              } else {
                                setSelectedSourceIds((prev) => prev.filter((id) => id !== s.id));
                              }
                            }}
                            className="h-3 w-3 rounded text-focus cursor-pointer"
                          />
                          <span className="truncate">{s.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !noteContent.trim()}
                  className="py-2 px-5 bg-paper-raised border border-rule-strong hover:border-ink font-semibold text-xs text-ink rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="p-6 bg-paper-raised border border-rule text-center text-xs text-ink-soft">
                  No notes recorded yet. As you review reference materials, write your own notes and findings above.
                </div>
              ) : (
                notes.map((note) => {
                  const linkedQ = questions.find((q) => q.id === note.researchQuestionId);
                  const linkedSources = note.noteSources?.map((ns: any) => ns.source) || [];

                  return (
                    <div key={note.id} className="p-4 bg-paper-raised border border-rule space-y-2 group">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs text-ink-soft hover:text-danger opacity-40 group-hover:opacity-100 transition-opacity"
                          title="Delete note"
                        >
                          ×
                        </button>
                      </div>

                      {(linkedQ || linkedSources.length > 0) && (
                        <div className="pt-2 border-t border-rule/50 flex flex-wrap items-center gap-2 text-[10px] font-mono text-ink-soft">
                          {linkedQ && (
                            <span className="px-2 py-0.5 bg-paper border border-rule rounded">
                              Q: {linkedQ.question.slice(0, 30)}...
                            </span>
                          )}
                          {linkedSources.map((s: any) => (
                            <span key={s.id} className="px-2 py-0.5 bg-paper border border-rule rounded">
                              Ref: {s.title.slice(0, 25)}...
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="my-10 border-b border-rule w-full" />

        {/* Bottom Section: Sources Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs uppercase font-mono font-semibold tracking-wider text-ink-soft">
                Saved Research Sources
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Citations, papers, and references examined during this investigation
              </p>
            </div>

            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="py-2 px-4 bg-paper-raised border border-rule-strong hover:border-ink font-semibold text-xs text-ink rounded shadow-sm transition-colors"
            >
              {showAddSource ? 'Cancel' : '+ Add Source'}
            </button>
          </div>

          {/* Add Source Drawer / Form */}
          {showAddSource && (
            <form onSubmit={handleCreateSource} className="p-5 bg-paper-raised border border-rule space-y-4">
              <h3 className="font-serif text-sm font-semibold text-ink">Add Research Source</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-ink mb-1">Source Title *</label>
                  <input
                    type="text"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    required
                    placeholder="e.g. Science Magazine Article"
                    className="w-full p-2 text-xs bg-paper border border-rule-strong rounded focus:border-focus focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-ink mb-1">URL *</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    required
                    placeholder="https://..."
                    className="w-full p-2 text-xs bg-paper border border-rule-strong rounded focus:border-focus focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-ink mb-1">Author / Organization</label>
                  <input
                    type="text"
                    value={sourceAuthor}
                    onChange={(e) => setSourceAuthor(e.target.value)}
                    placeholder="e.g. NASA / MIT"
                    className="w-full p-2 text-xs bg-paper border border-rule-strong rounded focus:border-focus focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-ink mb-1">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="w-full p-2 text-xs bg-paper border border-rule rounded text-ink focus:outline-none"
                  >
                    <option value="ACADEMIC_PAPER">Academic Paper</option>
                    <option value="BOOK">Book</option>
                    <option value="SCIENTIFIC_ORGANIZATION">Scientific Organization</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="TECHNICAL_DOCUMENTATION">Technical Documentation</option>
                    <option value="ARTICLE">Article</option>
                    <option value="VIDEO">Video</option>
                    <option value="NEWS">News</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSource || !sourceTitle.trim() || !sourceUrl.trim()}
                  className="py-2 px-6 bg-paper-raised border border-rule-strong hover:border-ink font-semibold text-xs text-ink rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingSource ? 'Saving...' : 'Save Source'}
                </button>
              </div>
            </form>
          )}

          {/* Sources Grid (3-up desktop / 2-up tablet / 1-up mobile per design spec §4.4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.length === 0 ? (
              <div className="col-span-full p-6 bg-paper-raised border border-rule text-center text-xs text-ink-soft">
                No sources added yet. Document articles, papers, and textbooks you reference.
              </div>
            ) : (
              sources.map((source) => {
                let domain = source.url;
                try {
                  domain = new URL(source.url).hostname;
                } catch {
                  // ignore
                }

                const noteCount = (source as any)._count?.noteSources ?? 0;

                return (
                  <div
                    key={source.id}
                    className="p-4 bg-paper-raised border border-rule flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-ink line-clamp-2 leading-snug">
                          {source.title}
                        </h4>
                        <span className="shrink-0 px-2 py-0.5 bg-paper border border-rule text-[10px] font-mono text-ink-soft rounded">
                          {source.sourceType}
                        </span>
                      </div>

                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-ink-soft hover:text-ink truncate block hover:underline"
                        title={source.url}
                      >
                        {domain} ↗
                      </a>

                      {source.authorOrganization && (
                        <div className="text-[11px] text-ink-soft">
                          {source.authorOrganization}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-rule flex items-center justify-between text-[11px] text-ink-soft font-mono">
                      <span>{noteCount} notes linked</span>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-ink-soft hover:text-danger transition-colors"
                        title="Delete source"
                      >
                        × Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </AppShell>
  );
}
