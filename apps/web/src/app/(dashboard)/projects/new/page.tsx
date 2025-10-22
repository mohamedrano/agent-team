"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PromptForm } from "@/components/projects/PromptForm";

export default function NewProjectPage() {
  const router = useRouter();

  const handleSuccess = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">New Project</h1>
            <p className="mt-2 text-muted-foreground">
              Describe your project and let AI agents bring it to life
            </p>
          </div>

          <PromptForm onSuccess={handleSuccess} />
        </main>
      </div>
    </div>
  );
}
