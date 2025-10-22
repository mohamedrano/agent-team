"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useProjectsStore } from "@/stores/projects";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ExecutionTimeline } from "@/components/timeline/ExecutionTimeline";
import { LogsViewer } from "@/components/logs/LogsViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentProject, isLoading, fetchById } = useProjectsStore();

  useEffect(() => {
    if (id) {
      fetchById(id);
    }
  }, [id, fetchById]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{currentProject.name}</h1>
              <Badge
                variant={
                  currentProject.status === "completed"
                    ? "success"
                    : currentProject.status === "failed"
                    ? "destructive"
                    : "default"
                }
              >
                {currentProject.status}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {currentProject.description}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Execution Timeline</CardTitle>
                <CardDescription>
                  Real-time updates on project progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExecutionTimeline projectId={id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
                <CardDescription>Detailed execution logs</CardDescription>
              </CardHeader>
              <CardContent>
                <LogsViewer projectId={id} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
