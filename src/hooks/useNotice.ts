import { useCallback, useEffect, useState } from 'react';

export function useNotice() {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const notify = useCallback((text: string, error = false) => setMessage({ text, error }), []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return { message, notify };
}
