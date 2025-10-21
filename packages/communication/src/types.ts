export type QoS = "at-most-once" | "at-least-once" | "exactly-once";
export type MsgType = "TASK" | "TOOL_CALL" | "DEBATE_PROPOSAL" | "DEBATE_CRITIQUE" | "DEBATE_DECISION";

export interface MessageEnvelope<P = unknown> {
  id: string;            // UUID v4
  ts: number;            // unix ms
  type: MsgType;
  qos: QoS;
  topic?: string;        // اختياري للتوجيه الموضوعي
  from: string;          // agent id
  to?: string | string[];// agent ids
  payload: P;
  meta?: Record<string, unknown>;
  sig?: string;          // HMAC
}
