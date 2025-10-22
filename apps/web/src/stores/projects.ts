import { create } from "zustand";
import type { Project } from "@/lib/types";

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: {
    status?: string;
    search?: string;
  };
  
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<ProjectsState["pagination"]>) => void;
  setFilters: (filters: Partial<ProjectsState["filters"]>) => void;
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Project>) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  filters: {},

  setProjects: (projects) => set({ projects }),
  
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  fetchAll: async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";
    
    set({ isLoading: true, error: null });
    
    try {
      if (useMock) {
        // Mock data
        const mockProjects: Project[] = [
          {
            id: "1",
            name: "Sample Project",
            description: "A sample project for testing",
            status: "completed",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "user-1",
          },
        ];
        set({ projects: mockProjects, isLoading: false });
        return;
      }

      const response = await fetch(`${baseUrl}/projects`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      
      const projects = await response.json();
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchById: async (id) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";
    
    set({ isLoading: true, error: null });
    
    try {
      if (useMock) {
        const mockProject: Project = {
          id,
          name: "Sample Project",
          description: "A sample project for testing",
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "user-1",
        };
        set({ currentProject: mockProject, isLoading: false });
        return;
      }

      const response = await fetch(`${baseUrl}/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      
      const project = await response.json();
      set({ currentProject: project, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  create: async (data) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";
    
    set({ isLoading: true, error: null });
    
    try {
      if (useMock) {
        const newProject: Project = {
          id: String(Date.now()),
          name: data.name || "New Project",
          description: data.description || "",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "user-1",
          ...data,
        };
        get().addProject(newProject);
        set({ isLoading: false });
        return;
      }

      const response = await fetch(`${baseUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to create project");
      
      const project = await response.json();
      get().addProject(project);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },
}));

