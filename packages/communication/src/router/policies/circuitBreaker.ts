export class CircuitBreaker {
  constructor(private threshold = 5, private timeoutMs = 60_000) {}
  private failures = 0;
  private openedAt = 0;
  get isOpen() { return this.failures >= this.threshold && Date.now() - this.openedAt < this.timeoutMs; }
  markSuccess(){ this.failures = 0; }
  markFailure(){ if (++this.failures === this.threshold) this.openedAt = Date.now(); }
}
