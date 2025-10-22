"use client";

import { useEffect, useState, useCallback } from "react";

interface UseSSEOptions {
  enabled?: boolean;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

export function useSSE<T = any>(url: string, options: UseSSEOptions = {}) {
  const { enabled = true, onMessage, onError } = options;
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData((prev) => [...prev, parsed]);
        onMessage?.(parsed);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError(err);
      onError?.(err);
      eventSource.close();
    };

    return eventSource;
  }, [url, enabled, onMessage, onError]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      eventSource?.close();
    };
  }, [connect]);

  return { data, isConnected, error };
}
