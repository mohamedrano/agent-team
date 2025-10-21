import { MemoryBus, Router, MessageEnvelopeSchema } from "@agent-team/communication";
import type { MessageEnvelope } from "@agent-team/communication";

/**
 * Communication adapter that wraps @agent-team/communication
 */
export class CommAdapter {
  public bus: MemoryBus;
  public router: Router;

  constructor() {
    this.bus = new MemoryBus();
    this.router = new Router(this.bus);
  }

  /**
   * Start the router
   */
  async start(): Promise<void> {
    await this.router.start();
  }

  /**
   * Stop the router
   */
  async stop(): Promise<void> {
    await this.router.stop();
  }

  /**
   * Send a message
   */
  async send(envelope: MessageEnvelope): Promise<void> {
    MessageEnvelopeSchema.parse(envelope);
    await this.bus.publish(envelope);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: (msg: MessageEnvelope) => Promise<void>): void {
    this.router.registerAgent(topic, handler);
  }

  /**
   * Publish an event
   */
  async publish(topic: string, payload: unknown, from: string): Promise<void> {
    await this.bus.publish({
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic,
      from,
      payload
    });
  }
}
