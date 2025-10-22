import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@/lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isLoading: false,

      setSession: (session) => {
        set({ session, user: session?.user ?? null });
      },

      setUser: (user) => {
        set({ user });
      },

      clear: () => {
        set({ session: null, user: null });
      },

      isAuthenticated: () => {
        const { session } = get();
        if (!session) return false;
        return session.expiresAt > Date.now();
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    }
  )
);
