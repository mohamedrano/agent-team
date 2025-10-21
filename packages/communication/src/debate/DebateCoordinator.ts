import { score, type Proposal } from "./scoring.js";

export class DebateCoordinator {
  private proposals: Proposal[] = [];
  private critiques: Record<string, string[]> = {};
  collectProposal(p: Proposal){ this.proposals.push(p); }
  collectCritique(id: string, text: string){ (this.critiques[id] ??= []).push(text); }
  decide(){
    const ranked = this.proposals.map(p => ({ p, s: score(p)})).sort((a,b)=>b.s-a.s);
    const winner = ranked[0]?.p ?? null;
    return { winner, ranked };
  }
}
