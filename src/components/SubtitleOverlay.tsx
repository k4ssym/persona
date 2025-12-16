'use client';

import { useEffect, useRef, useState } from 'react';

interface SubtitleOverlayProps {
  vapi: any; // Vapi instance
}

export default function SubtitleOverlay({ vapi }: SubtitleOverlayProps) {
  const [userText, setUserText] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [mode, setMode] = useState<'user' | 'assistant' | null>(null);

  const userHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!vapi) return;

    const onMessage = (message: any) => {
      if (message?.type !== 'transcript') return;

      const role = message?.role === 'user' ? 'user' : 'assistant';
      const text = String(message?.transcript ?? '').trim();
      if (!text) return;

      const transcriptType = String(message?.transcriptType ?? '').toLowerCase();
      const isPartial = transcriptType === 'partial';

      if (role === 'user') {
        if (userHideTimerRef.current) {
          clearTimeout(userHideTimerRef.current);
          userHideTimerRef.current = null;
        }
        setUserText(text);
        setMode('user');
        if (!isPartial) userHideTimerRef.current = setTimeout(() => setUserText(''), 3000);
        return;
      }

      if (assistantHideTimerRef.current) {
        clearTimeout(assistantHideTimerRef.current);
        assistantHideTimerRef.current = null;
      }
      setAssistantText(text);
      setMode('assistant');
      if (!isPartial) assistantHideTimerRef.current = setTimeout(() => setAssistantText(''), 5000);
    };

    vapi.on('message', onMessage);
    return () => {
      vapi.off('message', onMessage);
      if (userHideTimerRef.current) {
        clearTimeout(userHideTimerRef.current);
        userHideTimerRef.current = null;
      }
      if (assistantHideTimerRef.current) {
        clearTimeout(assistantHideTimerRef.current);
        assistantHideTimerRef.current = null;
      }
    };
  }, [vapi]);

  if (!userText && !assistantText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
        padding: '0 2rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      {userText && (
        <div
          style={{
            marginBottom: '1rem',
            backgroundColor: 'black',
            border: '1px solid white',
            padding: '0.75rem 1.5rem',
            color: 'white',
            fontSize: '1.125rem',
            maxWidth: '42rem',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {userText}
        </div>
      )}
      {assistantText && (
        <div
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            maxWidth: '56rem',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {assistantText}
        </div>
      )}
    </div>
  );
}
