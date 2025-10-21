// ═══════════════════════════════════════════════════════════════════════════════
// Main Entry Point - Fastify Server Initialization
// ═══════════════════════════════════════════════════════════════════════════════

import { buildApp } from "./api.js";
import { createCommunicationLayer } from "./agents/communication.js";

/**
 * Server configuration from environment variables
 */
const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  host: process.env.HOST || "0.0.0.0",
  env: process.env.NODE_ENV || "development",
};

/**
 * Start the Fastify server
 */
async function start() {
  const app = buildApp();
  const communication = await createCommunicationLayer();
  (app as any).communication = communication;
  app.addHook("onClose", async () => {
    await communication.shutdown();
  });
  app.log.info("Communication layer initialized");

  // Initialize orchestration layer if enabled
  if (process.env.ORCH_ENABLED !== "false") {
    try {
      const { bootstrap } = await import("./orchestration.boot.js");
      const { adapter, orchestrator } = await bootstrap();
      (app as any).orchestration = { adapter, orchestrator };
      app.addHook("onClose", async () => {
        const { shutdown } = await import("./orchestration.boot.js");
        await shutdown();
      });
    } catch (err) {
      app.log.warn(err, "Failed to initialize orchestration layer");
    }
  }

  try {
    // Validate configuration
    if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
      throw new Error(`Invalid PORT: ${process.env.PORT}`);
    }

    // Log startup configuration
    app.log.info(
      {
        port: config.port,
        host: config.host,
        env: config.env,
        nodeVersion: process.version,
      },
      "Starting Agent Team server..."
    );

    // Start listening
    await app.listen({
      port: config.port,
      host: config.host,
    });

    app.log.info(
      `🚀 Server is running on http://${config.host}:${config.port}`
    );
    app.log.info(`📊 Health check: http://${config.host}:${config.port}/health`);
    app.log.info(`🤖 Agents registry: http://${config.host}:${config.port}/api/agents`);
    app.log.info(`Environment: ${config.env}`);

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        await app.close();
        app.log.info("Server closed successfully");
        process.exit(0);
      } catch (err) {
        app.log.error(err, "Error during shutdown");
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (err) => {
      app.log.fatal(err, "Uncaught exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      app.log.fatal(
        { reason, promise },
        "Unhandled promise rejection"
      );
      process.exit(1);
    });

  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  }
}

// Start the server
start();
