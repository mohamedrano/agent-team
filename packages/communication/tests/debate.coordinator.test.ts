import { describe, expect, it } from "vitest";
import { DebateCoordinator, score, type Proposal } from "../src/index.js";

describe("DebateCoordinator", () => {
  it("scores proposals and selects the best one", () => {
    const coordinator = new DebateCoordinator();
    const proposals: Proposal[] = [
      { id: "p1", text: "Option A", confidence: 0.6, cost: 0.2, risk: 0.4, evidence: 0.8 },
      { id: "p2", text: "Option B", confidence: 0.9, cost: 0.6, risk: 0.7, evidence: 0.9 },
      { id: "p3", text: "Option C", confidence: 0.5, cost: 0.1, risk: 0.2, evidence: 0.6 },
    ];

    proposals.forEach((p) => coordinator.collectProposal(p));
    coordinator.collectCritique("p1", "Consider integration complexity");
    coordinator.collectCritique("p2", "Risk of vendor lock-in");
    coordinator.collectCritique("p2", "Higher operational cost");

    const decision = coordinator.decide();

    expect(decision.winner?.id).toBeDefined();
    expect(decision.ranked[0]?.p.id).toBe(decision.winner?.id ?? "");
    for (let i = 1; i < decision.ranked.length; i += 1) {
      expect(decision.ranked[i - 1]!.s).toBeGreaterThanOrEqual(decision.ranked[i]!.s);
    }

    const coordinatorInternals = coordinator as unknown as { critiques: Record<string, string[]> };
    expect(coordinatorInternals.critiques["p2"]).toHaveLength(2);
  });
});

describe("score function", () => {
  it("assigns higher score to stronger evidence", () => {
    const lowEvidence: Proposal = { id: "low", text: "", confidence: 0.8, cost: 0.2, risk: 0.2, evidence: 0.1 };
    const highEvidence: Proposal = { id: "high", text: "", confidence: 0.8, cost: 0.2, risk: 0.2, evidence: 0.9 };
    expect(score(highEvidence)).toBeGreaterThan(score(lowEvidence));
  });
});
