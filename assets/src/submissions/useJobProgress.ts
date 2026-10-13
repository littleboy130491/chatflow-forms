import { useEffect, useRef, useState } from '@wordpress/element';
import type { AdminApi } from '../builder/api';
export function useJobProgress<T extends { status: string }>(
  api: AdminApi,
  path: string | null,
  status: string | undefined,
  onResult: (job: T) => void,
  onError: (error: unknown) => void,
): () => void {
  const callbacks = useRef({ onResult, onError });
  callbacks.current = { onResult, onError };
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!path || !['queued', 'running'].includes(status ?? '')) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await api.request<T>(path, 'GET', undefined, abort.signal);
        if (abort.signal.aborted) return;
        callbacks.current.onResult(result);
        if (['queued', 'running'].includes(result.status)) timer = setTimeout(poll, 2000);
      } catch (error) {
        if (!abort.signal.aborted) callbacks.current.onError(error);
      }
    };
    timer = setTimeout(poll, refresh ? 0 : 2000);
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [api, path, status, refresh]);
  return () => setRefresh((value) => value + 1);
}
