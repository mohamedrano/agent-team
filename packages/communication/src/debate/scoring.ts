export interface Proposal { id: string; text: string; confidence: number; cost: number; risk: number; evidence: number; }
export function score(p: Proposal){ 
  // وزن بسيط: الدليل 40%، الثقة 25%، التكلفة عكسي 15%، المخاطر عكسي 20%
  return 0.4*p.evidence + 0.25*p.confidence + 0.15*(1-Math.min(1,p.cost)) + 0.2*(1-Math.min(1,p.risk));
}
