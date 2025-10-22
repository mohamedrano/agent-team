"use client";

import type { Agent } from "@/lib/types";

interface AgentMetricsProps {
  metrics: NonNullable<Agent["metrics"]>;
}

export function AgentMetrics({ metrics }: AgentMetricsProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tasks Completed</span>
          <span className="font-semibold">{metrics.tasksCompleted}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg. Time</span>
          <span className="font-semibold">{metrics.averageTime}s</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Success Rate</span>
          <span className="font-semibold">
            {(metrics.successRate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${metrics.successRate * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
