"use client";

import { useEffect } from "react";
import { useAgentsStore } from "@/stores/agents";
import { AgentMetrics } from "@/components/metrics/AgentMetrics";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export default function AgentsPage() {
  const { agents, isLoading, fetchAll, startPolling, stopPolling } = useAgentsStore();

  useEffect(() => {
    fetchAll();
    startPolling();
    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor and manage your AI agents
            </p>
          </div>

          {isLoading && agents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{agent.name}</CardTitle>
                      <Badge
                        variant={
                          agent.status === "active"
                            ? "success"
                            : agent.status === "error"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <CardDescription>{agent.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agent.metrics && <AgentMetrics metrics={agent.metrics} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
