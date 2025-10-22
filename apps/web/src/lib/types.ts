export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  userId: string;
  prompt?: string;
  artifacts?: Artifact[];
}

export interface Artifact {
  id: string;
  projectId: string;
  type: "prd" | "code" | "doc" | "test";
  name: string;
  url: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "active" | "busy" | "error";
  metrics?: {
    tasksCompleted: number;
    averageTime: number;
    successRate: number;
  };
}

export interface ExecutionEvent {
  id: string;
  projectId: string;
  timestamp: string;
  type: "task_started" | "task_completed" | "task_failed" | "agent_assigned";
  agentId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  projectId: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
}

