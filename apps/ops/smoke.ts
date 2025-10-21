// ═══════════════════════════════════════════════════════════════════════════════
// Smoke Tests - Post-Deployment Health Checks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Smoke test configuration
 */
interface SmokeTestConfig {
  url: string;
  timeout: number;
  maxLatency: number;
}

/**
 * Test result
 */
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

/**
 * Parse command line arguments
 */
function parseArgs(): SmokeTestConfig {
  const args = process.argv.slice(2);
  const config: SmokeTestConfig = {
    url: process.env.SERVICE_URL || "http://localhost:8080",
    timeout: 10000, // 10 seconds
    maxLatency: 2000, // 2 seconds
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--url=")) {
      config.url = args[i].split("=")[1];
    } else if (args[i] === "--url" && args[i + 1]) {
      config.url = args[i + 1];
      i++;
    } else if (args[i].startsWith("--timeout=")) {
      config.timeout = parseInt(args[i].split("=")[1], 10);
    } else if (args[i].startsWith("--max-latency=")) {
      config.maxLatency = parseInt(args[i].split("=")[1], 10);
    }
  }

  return config;
}

/**
 * Perform HTTP request with timeout
 */
async function httpRequest(
  url: string,
  options: any,
  timeout: number
): Promise<{ response: Response; duration: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const duration = Date.now() - startTime;

    clearTimeout(timeoutId);
    return { response, duration };
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck(config: SmokeTestConfig): Promise<TestResult> {
  const testName = "Health Check";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/health`,
      { method: "GET" },
      config.timeout
    );

    if (response.status !== 200) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    const body = await response.json();

    if (body.status !== "healthy") {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status "healthy", got "${body.status}"`,
      };
    }

    console.log(`  ✅ Passed (${duration}ms)`);
    return {
      name: testName,
      passed: true,
      duration,
      details: body,
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Test 2: Readiness Check
 */
async function testReadinessCheck(
  config: SmokeTestConfig
): Promise<TestResult> {
  const testName = "Readiness Check";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/ready`,
      { method: "GET" },
      config.timeout
    );

    if (response.status !== 200) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    const body = await response.json();

    if (!body.ready) {
      return {
        name: testName,
        passed: false,
        duration,
        error: "Service is not ready",
      };
    }

    console.log(`  ✅ Passed (${duration}ms)`);
    return {
      name: testName,
      passed: true,
      duration,
      details: body,
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Test 3: Agent Registry
 */
async function testAgentRegistry(config: SmokeTestConfig): Promise<TestResult> {
  const testName = "Agent Registry";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/api/agents`,
      { method: "GET" },
      config.timeout
    );

    if (response.status !== 200) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    const body = await response.json();

    if (!body.data || !body.data.agents || body.data.agents.length === 0) {
      return {
        name: testName,
        passed: false,
        duration,
        error: "No agents found in registry",
      };
    }

    console.log(`  ✅ Passed (${duration}ms) - ${body.data.total} agents found`);
    return {
      name: testName,
      passed: true,
      duration,
      details: { agentCount: body.data.total },
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Test 4: API Response Time
 */
async function testResponseTime(config: SmokeTestConfig): Promise<TestResult> {
  const testName = "API Response Time";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/health`,
      { method: "GET" },
      config.timeout
    );

    if (response.status !== 200) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    if (duration > config.maxLatency) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Response time ${duration}ms exceeds max latency ${config.maxLatency}ms`,
      };
    }

    console.log(`  ✅ Passed (${duration}ms < ${config.maxLatency}ms)`);
    return {
      name: testName,
      passed: true,
      duration,
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Test 5: Security Headers
 */
async function testSecurityHeaders(
  config: SmokeTestConfig
): Promise<TestResult> {
  const testName = "Security Headers";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/health`,
      { method: "GET" },
      config.timeout
    );

    const headers = response.headers;
    const missingHeaders: string[] = [];

    // Check for X-Request-ID
    if (!headers.get("x-request-id")) {
      missingHeaders.push("X-Request-ID");
    }

    if (missingHeaders.length > 0) {
      console.log(`  ⚠️  Warning: Missing headers: ${missingHeaders.join(", ")}`);
      return {
        name: testName,
        passed: true, // Warning only, not a failure
        duration,
        details: { missingHeaders },
      };
    }

    console.log(`  ✅ Passed (${duration}ms)`);
    return {
      name: testName,
      passed: true,
      duration,
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Test 6: Invalid Request Handling
 */
async function testErrorHandling(config: SmokeTestConfig): Promise<TestResult> {
  const testName = "Error Handling";
  console.log(`\n🔍 Running: ${testName}...`);

  try {
    const { response, duration } = await httpRequest(
      `${config.url}/api/agent-team/run`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Missing required 'prompt'
      },
      config.timeout
    );

    if (response.status !== 400) {
      return {
        name: testName,
        passed: false,
        duration,
        error: `Expected status 400 for invalid request, got ${response.status}`,
      };
    }

    const body = await response.json();

    if (!body.error) {
      return {
        name: testName,
        passed: false,
        duration,
        error: "Expected error object in response",
      };
    }

    console.log(`  ✅ Passed (${duration}ms)`);
    return {
      name: testName,
      passed: true,
      duration,
    };
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`);
    return {
      name: testName,
      passed: false,
      duration: 0,
      error: error.message,
    };
  }
}

/**
 * Print summary
 */
function printSummary(results: TestResult[], totalDuration: number) {
  console.log("\n" + "═".repeat(80));
  console.log("📊 SMOKE TEST SUMMARY");
  console.log("═".repeat(80));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log("\n" + "═".repeat(80));
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting Smoke Tests...");

  const config = parseArgs();
  console.log(`\nTarget URL: ${config.url}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Max Latency: ${config.maxLatency}ms`);

  const startTime = Date.now();
  const results: TestResult[] = [];

  // Run all tests
  results.push(await testHealthCheck(config));
  results.push(await testReadinessCheck(config));
  results.push(await testAgentRegistry(config));
  results.push(await testResponseTime(config));
  results.push(await testSecurityHeaders(config));
  results.push(await testErrorHandling(config));

  const totalDuration = Date.now() - startTime;

  // Print summary
  printSummary(results, totalDuration);

  // Exit with appropriate code
  const failedTests = results.filter((r) => !r.passed).length;
  if (failedTests > 0) {
    console.error(`\n❌ ${failedTests} test(s) failed`);
    process.exit(1);
  } else {
    console.log("\n✅ All smoke tests passed!");
    process.exit(0);
  }
}

// Run smoke tests
main().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
