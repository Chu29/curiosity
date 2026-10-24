'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../../lib/api/client';

type RecordingState = 'permission-required' | 'ready' | 'recording' | 'stopping' | 'uploading' | 'submitted' | 'error';

function chooseMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'].find((type) => MediaRecorder.isTypeSupported(type));
}

export default function PresentationModePage() {
  const params = useParams();
  const sessionId = params?.id as string;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const presentationIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const initializingRef = useRef(false);
  const [state, setState] = useState<RecordingState>('permission-required');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Microphone unavailable');

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const begin = useCallback(async () => {
    if (startedRef.current || initializingRef.current || !sessionId) return;
    initializingRef.current = true;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = chooseMimeType();
      if (typeof MediaRecorder === 'undefined' || !mimeType) throw new Error('This browser does not support audio recording.');
      const presentation = await apiFetch<{ id: string }>(`/sessions/${sessionId}/presentations`, { method: 'POST' });
      presentationIdRef.current = presentation.id;
      await apiFetch(`/presentations/${presentation.id}/start`, { method: 'POST' });
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.start();
      startedRef.current = true;
      initializingRef.current = false;
      setState('recording');
    } catch (cause) {
      initializingRef.current = false;
      stopTracks();
      setState('error');
      const isMicrophoneError = cause instanceof DOMException && (cause.name === 'NotAllowedError' || cause.name === 'NotFoundError');
      setErrorTitle(isMicrophoneError ? 'Microphone unavailable' : 'Presentation unavailable');
      setError(isMicrophoneError
        ? cause.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow microphone access, then try again.'
          : 'No usable microphone was found. Connect one, then try again.'
        : cause instanceof Error ? cause.message : 'The presentation could not be started.');
    }
  }, [sessionId, stopTracks]);

  useEffect(() => {
    void begin();
    return () => {
      recorderRef.current?.stop();
      stopTracks();
    };
  }, [begin, stopTracks]);

  useEffect(() => {
    if (state !== 'recording') return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  const endPresentation = async () => {
    const recorder = recorderRef.current;
    const presentationId = presentationIdRef.current;
    if (!recorder || !presentationId || state !== 'recording') return;
    setState('stopping');
    await new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true });
      recorder.stop();
    });
    stopTracks();
    setState('uploading');
    try {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const form = new FormData();
      form.append('file', blob, `presentation.${recorder.mimeType.split('/')[1] || 'audio'}`);
      await apiFetch(`/presentations/${presentationId}/upload`, { method: 'POST', body: form });
      await apiFetch(`/presentations/${presentationId}/submit`, { method: 'POST' });
      chunksRef.current = [];
      setState('submitted');
    } catch (cause) {
      setState('error');
      setErrorTitle('Upload unavailable');
      setError(cause instanceof Error ? cause.message : 'Upload failed. You can try ending the presentation again.');
    }
  };

  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  if (state === 'submitted') return <main className="presentation-stage"><section className="presentation-confirmation"><p className="presentation-kicker">Presentation submitted</p><h1>That was the presentation.</h1><p>Your recording is safely submitted. Transcription and evaluation are not part of this step.</p></section></main>;

  return <main className="presentation-stage">
    <section className="presentation-console" aria-live="polite">
      {state === 'error' ? <div className="presentation-recovery" role="alert"><p className="presentation-kicker">{errorTitle}</p><p>{error}</p><button className="ui-button ui-button--secondary" onClick={() => { startedRef.current = false; initializingRef.current = false; setState('permission-required'); void begin(); }}>Try Again</button></div> : <>
        <div className={`recording-status ${state === 'recording' ? 'recording-status--active' : ''}`}><span aria-hidden="true" className="recording-status__dot" /> <span>{state === 'recording' ? 'Recording' : state === 'uploading' || state === 'stopping' ? 'Finishing' : 'Preparing microphone'}</span></div>
        <div className="presentation-timer" aria-label={`Elapsed time ${time}`}>{time}</div>
        <button className="ui-button ui-button--destructive presentation-end" onClick={endPresentation} disabled={state !== 'recording'}>End Presentation</button>
      </>}
    </section>
  </main>;
}
