export function expoBackoff(attempt: number, baseMs = 100, maxMs = 30_000) {
  const d = Math.min(maxMs, baseMs * 2 ** attempt);
  return d + Math.floor(Math.random() * baseMs);
}
