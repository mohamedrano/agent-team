import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Header } from "@/components/layout/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
}

