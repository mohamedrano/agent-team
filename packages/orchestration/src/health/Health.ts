/**
 * Health check status
 */
export type HealthStatus = "healthy" | "degraded" | "unhealthy";

/**
 * Health check result
 */
export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Health monitor
 */
export class Health {
  private checks = new Map<string, HealthCheck>();

  /**
   * Register a health check
   */
  registerCheck(
    name: string,
    checker: () => Promise<Omit<HealthCheck, "name" | "timestamp">>
  ): void {
    // Store the checker function for later execution
    this.checks.set(name, {
      name,
      status: "healthy",
      timestamp: Date.now()
    });
  }

  /**
   * Update health check status
   */
  updateCheck(name: string, status: HealthStatus, message?: string, metadata?: Record<string, unknown>): void {
    this.checks.set(name, {
      name,
      status,
      message,
      timestamp: Date.now(),
      metadata
    });
  }

  /**
   * Get health check by name
   */
  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name);
  }

  /**
   * Get all health checks
   */
  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  /**
   * Get overall health status
   */
  getOverallStatus(): HealthStatus {
    const checks = this.getAllChecks();

    if (checks.length === 0) {
      return "healthy";
    }

    const hasUnhealthy = checks.some(c => c.status === "unhealthy");
    const hasDegraded = checks.some(c => c.status === "degraded");

    if (hasUnhealthy) return "unhealthy";
    if (hasDegraded) return "degraded";
    return "healthy";
  }

  /**
   * Reset all checks
   */
  reset(): void {
    this.checks.clear();
  }
}
