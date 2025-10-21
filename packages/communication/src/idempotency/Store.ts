export interface IdempotencyStore {
  seen(id: string): Promise<boolean>;
  mark(id: string, ttlSec: number): Promise<void>;
  sweep?(): Promise<void>;
}
