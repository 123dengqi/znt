import { useCallback, useRef, useState } from 'react';
import { apiPath } from '../env';

export interface StreamCitation {
  chunk_id: number;
  document_id: number;
  chapter: string;
  school: string;
  score: number;
  text: string;
}

export interface StreamState {
  text: string;
  loading: boolean;
  citations: StreamCitation[];
  safety_flag: string;
  notice: string;
  session_id: string;
  error?: string;
}

const initial: StreamState = {
  text: '',
  loading: false,
  citations: [],
  safety_flag: 'ok',
  notice: '',
  session_id: '',
};

export function useStreamQA() {
  const [state, setState] = useState<StreamState>(initial);
  const ctrlRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    ctrlRef.current?.abort();
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const ask = useCallback(async (body: { question: string; chapter?: string; school?: string }) => {
    abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState({ ...initial, loading: true });
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(apiPath('/api/chat/qa/stream'), {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      const reader = r.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const m = line.match(/^data:\s*(.*)$/m);
          if (!m) continue;
          try {
            const evt = JSON.parse(m[1]);
            if (evt.type === 'meta') {
              setState((s) => ({
                ...s,
                citations: evt.citations || [],
                safety_flag: evt.safety_flag || 'ok',
                notice: evt.notice || '',
                session_id: evt.session_id || '',
              }));
            } else if (evt.type === 'delta') {
              setState((s) => ({ ...s, text: s.text + (evt.text || '') }));
            } else if (evt.type === 'done') {
              setState((s) => ({ ...s, loading: false }));
            } else if (evt.type === 'error') {
              setState((s) => ({ ...s, loading: false, error: evt.message }));
            }
          } catch {
            // ignore parse error
          }
        }
      }
      setState((s) => ({ ...s, loading: false }));
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setState((s) => ({ ...s, loading: false, error: String(e?.message || e) }));
      }
    }
  }, [abort]);

  const reset = useCallback(() => setState(initial), []);

  return { state, ask, abort, reset };
}
