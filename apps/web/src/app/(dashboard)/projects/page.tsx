"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/stores/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, filters, setFilters, fetchAll } = useProjectsStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Projects</h1>
            <Button onClick={() => router.push("/projects/new")}>
              New Project
            </Button>
          </div>

          <div className="mb-6 flex gap-4">
            <Input
              placeholder="Search projects..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="max-w-xs"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to get started"
              action={{
                label: "Create Project",
                onClick: () => router.push("/projects/new"),
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
