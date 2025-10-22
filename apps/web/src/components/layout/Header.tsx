"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export function Header() {
  const { user, clear } = useAuthStore();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="mobile-menu"
            aria-label="Open navigation"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-xl lg:hidden"
          >
            ☰
          </button>
          <Link href="/" className="text-xl font-bold" data-testid="site-logo">
            Agent Team
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" onClick={() => clear()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

