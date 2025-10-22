"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
        Build with <span className="text-primary">AI Agents</span>
      </h1>
      <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
        Transform your ideas into reality with collaborative AI agents that work
        together seamlessly
      </p>
      <Link href="/projects/new">
        <Button size="lg" className="text-lg">
          Get Started
        </Button>
      </Link>
    </section>
  );
}

