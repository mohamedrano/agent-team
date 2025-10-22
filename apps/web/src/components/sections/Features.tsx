"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Team Collaboration",
    description: "AI agents work together seamlessly to achieve your goals",
    icon: "🤝",
  },
  {
    title: "Real-time Updates",
    description: "Watch your project come to life with live progress updates",
    icon: "⚡",
  },
  {
    title: "Deep Insights",
    description: "Understand every step of the process with detailed logs",
    icon: "📊",
  },
];

export function Features() {
  return (
    <section className="container py-24">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-4xl font-bold">Features</h2>
        <p className="text-xl text-muted-foreground">
          Everything you need to build with AI
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="mb-2 text-4xl">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
