"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectsStore } from "@/stores/projects";
import { toast } from "sonner";

const projectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  prompt: z.string().min(20, "Prompt must be at least 20 characters"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface PromptFormProps {
  onSuccess?: (projectId: string) => void;
}

const examples = [
  "Build a todo app with user authentication",
  "Create a blog with markdown support",
  "Develop an e-commerce platform",
];

export function PromptForm({ onSuccess }: PromptFormProps) {
  const { create, isLoading } = useProjectsStore();
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await create(data);
      toast.success("Project created successfully!");
      onSuccess?.("new-project-id");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleExampleClick = (example: string) => {
    setSelectedExample(example);
    setValue("prompt", example);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Provide details about your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Project Name
              </label>
              <Input
                id="name"
                {...register("name")}
                placeholder="My Awesome Project"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Input
                id="description"
                {...register("description")}
                placeholder="A brief description of your project"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                Project Prompt
              </label>
              <textarea
                id="prompt"
                {...register("prompt")}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe what you want to build..."
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.prompt.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Examples</CardTitle>
          <CardDescription>Quick start with these examples</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {examples.map((example, index) => (
              <Button
                key={index}
                variant={selectedExample === example ? "default" : "outline"}
                className="w-full justify-start text-left"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

