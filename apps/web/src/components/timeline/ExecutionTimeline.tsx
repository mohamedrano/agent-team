"use client";

import { useEffect, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { ExecutionEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ExecutionTimelineProps {
  projectId: string;
}

export function ExecutionTimeline({ projectId }: ExecutionTimelineProps) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";
  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  // SSE connection
  const { data: sseEvents } = useSSE<ExecutionEvent>(
    useMock ? "" : `${baseUrl}/events?projectId=${projectId}`,
    { enabled: !useMock }
  );

  // Fallback polling
  useEffect(() => {
    if (useMock) {
      const mockEvents: ExecutionEvent[] = [
        {
          id: "1",
          projectId,
          timestamp: new Date().toISOString(),
          type: "task_started",
          message: "Project initialization started",
          agentId: "agent-1",
        },
        {
          id: "2",
          projectId,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          type: "agent_assigned",
          message: "Backend agent assigned to task",
          agentId: "agent-2",
        },
      ];
      setEvents(mockEvents);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${baseUrl}/events?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to poll events:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, baseUrl, useMock]);

  // Update events from SSE
  useEffect(() => {
    if (sseEvents.length > 0) {
      setEvents(sseEvents);
    }
  }, [sseEvents]);

  const getEventIcon = (type: ExecutionEvent["type"]) => {
    switch (type) {
      case "task_started":
        return "🚀";
      case "task_completed":
        return "✅";
      case "task_failed":
        return "❌";
      case "agent_assigned":
        return "🤖";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet</p>
      ) : (
        <div className="relative space-y-4">
          <div className="absolute left-4 top-0 h-full w-px bg-border" />
          {events.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-lg">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{event.message}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {event.type.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
