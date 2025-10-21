/**
 * Metrics collector for orchestration
 */
export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export class Metrics {
  private metrics: MetricData[] = [];
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  /**
   * Record a counter increment
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);

    this.record({
      name,
      value: current + value,
      tags,
      timestamp: Date.now()
    });
  }

  /**
   * Record a gauge value
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    this.gauges.set(key, value);

    this.record({
      name,
      value,
      tags,
      timestamp: Date.now()
    });
  }

  /**
   * Record a metric
   */
  private record(metric: MetricData): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.makeKey(name, tags);
    return this.counters.get(key) ?? 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, tags?: Record<string, string>): number {
    const key = this.makeKey(name, tags);
    return this.gauges.get(key) ?? 0;
  }

  /**
   * Get all metrics
   */
  getAll(): MetricData[] {
    return [...this.metrics];
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
  }

  private makeKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return `${name}{${tagStr}}`;
  }
}
