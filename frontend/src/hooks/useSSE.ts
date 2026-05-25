import { useCallback, useRef, useState } from 'react';

export interface SSEHandlers {
  onEvent: (evt: any) => void;
  onError?: (e: string) => void;
  onDone?: () => void;
}

export function useSSE() {
  const [running, setRunning] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setRunning(false);
  }, []);

  const post = useCallback(async (url: string, body: any, h: SSEHandlers) => {
    abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setRunning(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(url, {
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
        const blocks = buf.split('\n\n');
        buf = blocks.pop() || '';
        for (const block of blocks) {
          const m = block.match(/^data:\s*(.*)$/m);
          if (!m) continue;
          try {
            const evt = JSON.parse(m[1]);
            h.onEvent(evt);
          } catch {
            // ignore
          }
        }
      }
      h.onDone?.();
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        h.onError?.(String(e?.message || e));
      }
    } finally {
      setRunning(false);
      ctrlRef.current = null;
    }
  }, [abort]);

  return { running, post, abort };
}
