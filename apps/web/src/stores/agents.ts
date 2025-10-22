import { create } from "zustand";
import type { Agent } from "@/lib/types";

interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchAll: () => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  setAgents: (agents) => set({ agents }),
  
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  fetchAll: async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";
    
    set({ isLoading: true, error: null });
    
    try {
      if (useMock) {
        const mockAgents: Agent[] = [
          {
            id: "1",
            name: "Product Manager",
            type: "pm",
            status: "active",
            metrics: {
              tasksCompleted: 15,
              averageTime: 120,
              successRate: 0.95,
            },
          },
          {
            id: "2",
            name: "Backend Developer",
            type: "backend",
            status: "busy",
            metrics: {
              tasksCompleted: 23,
              averageTime: 180,
              successRate: 0.92,
            },
          },
          {
            id: "3",
            name: "Frontend Developer",
            type: "frontend",
            status: "idle",
            metrics: {
              tasksCompleted: 18,
              averageTime: 150,
              successRate: 0.97,
            },
          },
        ];
        set({ agents: mockAgents, isLoading: false });
        return;
      }

      const response = await fetch(`${baseUrl}/agents`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      
      const agents = await response.json();
      set({ agents, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  startPolling: (interval = 5000) => {
    if (pollingInterval) return;
    
    get().fetchAll();
    pollingInterval = setInterval(() => {
      get().fetchAll();
    }, interval);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
}));

