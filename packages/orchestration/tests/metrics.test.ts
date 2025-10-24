import { describe, it, expect, beforeEach } from "vitest";
import { Metrics, type MetricData } from "../src/metrics/Metrics.js";

describe("Metrics", () => {
  let metrics: Metrics;

  beforeEach(() => {
    metrics = new Metrics();
  });

  describe("increment", () => {
    it("should increment a counter by 1 by default", () => {
      metrics.increment("test_counter");

      expect(metrics.getCounter("test_counter")).toBe(1);
    });

    it("should increment a counter by specified value", () => {
      metrics.increment("test_counter", 5);

      expect(metrics.getCounter("test_counter")).toBe(5);
    });

    it("should increment multiple times", () => {
      metrics.increment("test_counter", 2);
      metrics.increment("test_counter", 3);

      expect(metrics.getCounter("test_counter")).toBe(5);
    });

    it("should handle tags correctly", () => {
      metrics.increment("test_counter", 1, { service: "api", method: "GET" });

      expect(metrics.getCounter("test_counter", { service: "api", method: "GET" })).toBe(1);
      expect(metrics.getCounter("test_counter")).toBe(0); // Different key without tags
    });

    it("should record metric data", () => {
      const beforeCount = metrics.getAll().length;
      metrics.increment("test_counter");

      const allMetrics = metrics.getAll();
      expect(allMetrics.length).toBe(beforeCount + 1);

      const lastMetric = allMetrics[allMetrics.length - 1];
      expect(lastMetric.name).toBe("test_counter");
      expect(lastMetric.value).toBe(1);
      expect(lastMetric.timestamp).toBeDefined();
      expect(typeof lastMetric.timestamp).toBe("number");
    });
  });

  describe("gauge", () => {
    it("should set gauge value", () => {
      metrics.gauge("test_gauge", 42);

      expect(metrics.getGauge("test_gauge")).toBe(42);
    });

    it("should update gauge value", () => {
      metrics.gauge("test_gauge", 42);
      metrics.gauge("test_gauge", 100);

      expect(metrics.getGauge("test_gauge")).toBe(100);
    });

    it("should handle tags correctly", () => {
      metrics.gauge("test_gauge", 42, { host: "server1" });

      expect(metrics.getGauge("test_gauge", { host: "server1" })).toBe(42);
      expect(metrics.getGauge("test_gauge")).toBe(0); // Different key without tags
    });

    it("should record metric data", () => {
      const beforeCount = metrics.getAll().length;
      metrics.gauge("test_gauge", 42);

      const allMetrics = metrics.getAll();
      expect(allMetrics.length).toBe(beforeCount + 1);

      const lastMetric = allMetrics[allMetrics.length - 1];
      expect(lastMetric.name).toBe("test_gauge");
      expect(lastMetric.value).toBe(42);
      expect(lastMetric.timestamp).toBeDefined();
      expect(typeof lastMetric.timestamp).toBe("number");
    });
  });

  describe("getCounter", () => {
    it("should return 0 for non-existent counter", () => {
      expect(metrics.getCounter("non_existent")).toBe(0);
    });

    it("should return correct counter value", () => {
      metrics.increment("test_counter", 5);
      expect(metrics.getCounter("test_counter")).toBe(5);
    });

    it("should distinguish counters with different tags", () => {
      metrics.increment("test_counter", 1, { env: "prod" });
      metrics.increment("test_counter", 1, { env: "dev" });

      expect(metrics.getCounter("test_counter", { env: "prod" })).toBe(1);
      expect(metrics.getCounter("test_counter", { env: "dev" })).toBe(1);
      expect(metrics.getCounter("test_counter")).toBe(0);
    });
  });

  describe("getGauge", () => {
    it("should return 0 for non-existent gauge", () => {
      expect(metrics.getGauge("non_existent")).toBe(0);
    });

    it("should return correct gauge value", () => {
      metrics.gauge("test_gauge", 42);
      expect(metrics.getGauge("test_gauge")).toBe(42);
    });

    it("should distinguish gauges with different tags", () => {
      metrics.gauge("test_gauge", 100, { region: "us-east" });
      metrics.gauge("test_gauge", 200, { region: "us-west" });

      expect(metrics.getGauge("test_gauge", { region: "us-east" })).toBe(100);
      expect(metrics.getGauge("test_gauge", { region: "us-west" })).toBe(200);
      expect(metrics.getGauge("test_gauge")).toBe(0);
    });
  });

  describe("getAll", () => {
    it("should return empty array initially", () => {
      expect(metrics.getAll()).toEqual([]);
    });

    it("should return all recorded metrics", () => {
      metrics.increment("counter1", 1);
      metrics.gauge("gauge1", 42);
      metrics.increment("counter2", 2);

      const allMetrics = metrics.getAll();
      expect(allMetrics.length).toBe(3);

      expect(allMetrics[0]).toMatchObject({
        name: "counter1",
        value: 1
      });
      expect(allMetrics[1]).toMatchObject({
        name: "gauge1",
        value: 42
      });
      expect(allMetrics[2]).toMatchObject({
        name: "counter2",
        value: 2
      });
    });

    it("should return copy of metrics array", () => {
      metrics.increment("test", 1);
      const metrics1 = metrics.getAll();
      metrics.increment("test", 1);
      const metrics2 = metrics.getAll();

      expect(metrics1.length).toBe(1);
      expect(metrics2.length).toBe(2);
    });
  });

  describe("reset", () => {
    it("should clear all metrics data", () => {
      metrics.increment("counter", 5);
      metrics.gauge("gauge", 42);

      expect(metrics.getCounter("counter")).toBe(5);
      expect(metrics.getGauge("gauge")).toBe(42);
      expect(metrics.getAll().length).toBe(2);

      metrics.reset();

      expect(metrics.getCounter("counter")).toBe(0);
      expect(metrics.getGauge("gauge")).toBe(0);
      expect(metrics.getAll()).toEqual([]);
    });
  });

  describe("metrics retention", () => {
    it("should keep only last 1000 metrics", () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        metrics.increment(`counter_${i}`, 1);
      }

      const allMetrics = metrics.getAll();
      expect(allMetrics.length).toBe(1000);

      // Should have removed the first metric
      expect(allMetrics[0].name).toBe("counter_1");
      expect(allMetrics[0].value).toBe(1);
    });
  });

  describe("tag handling", () => {
    it("should sort tags consistently for key generation", () => {
      // Tags in different order should produce same key
      metrics.increment("test", 1, { z: "1", a: "2" });
      metrics.increment("test", 1, { a: "2", z: "1" });

      expect(metrics.getCounter("test", { a: "2", z: "1" })).toBe(2);
    });

    it("should handle undefined tags", () => {
      metrics.increment("test", 1, undefined);
      expect(metrics.getCounter("test")).toBe(1);
    });

    it("should handle empty tags object", () => {
      metrics.increment("test", 1, {});
      expect(metrics.getCounter("test")).toBe(1);
    });
  });
});
