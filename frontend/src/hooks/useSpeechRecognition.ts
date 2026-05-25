import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error?: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(lang: string = 'zh-CN'): SpeechResult {
  const SR: any =
    (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

  const [supported] = useState<boolean>(!!SR);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onerror = (e: any) => setError(e?.error || 'speech-error');
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? prev + finalText : finalText));
      setInterim(interimText);
    };
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(undefined);
    setInterim('');
    try {
      recRef.current.start();
    } catch (e: any) {
      setError(e?.message || 'start-error');
    }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}
