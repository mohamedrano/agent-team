import { z } from "zod";
export const MessageEnvelopeSchema = z.object({
  id: z.string().uuid(),
  ts: z.number().int().nonnegative(),
  type: z.enum(["TASK","TOOL_CALL","DEBATE_PROPOSAL","DEBATE_CRITIQUE","DEBATE_DECISION"]),
  qos: z.enum(["at-most-once","at-least-once","exactly-once"]),
  topic: z.string().optional(),
  from: z.string().min(1),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  payload: z.any(),
  meta: z.record(z.unknown()).optional(),
  sig: z.string().optional()
});

// Base type from Zod schema
type MessageEnvelopeBase = z.infer<typeof MessageEnvelopeSchema>;

// Generic version for type-safe payloads
export type MessageEnvelope<P = unknown> = Omit<MessageEnvelopeBase, 'payload'> & { payload: P };
