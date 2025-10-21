import { createHmac, timingSafeEqual } from "node:crypto";
import type { MessageEnvelope } from "../schemas.js";

export function sign(envelope: MessageEnvelope, secret: string): string {
  const data = JSON.stringify({ id: envelope.id, ts: envelope.ts, type: envelope.type, from: envelope.from, to: envelope.to, topic: envelope.topic, payload: envelope.payload });
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function verify(envelope: MessageEnvelope & { sig: string }, secret: string): boolean {
  const expected = sign(envelope, secret);
  try { return timingSafeEqual(Buffer.from(envelope.sig), Buffer.from(expected)); }
  catch { return false; }
}
