import type { Server } from "node:http";
import { createApp } from "./app.js";
import { config } from "./core/config/index.js";
import { logger } from "./core/logger/index.js";
import { connectDatabase, disconnectDatabase } from "./core/database/index.js";
import { APP_NAME, API_VERSION } from "@techquery/shared";

let server: Server | null = null;
let isShuttingDown = false;

/**
 * Graceful Server Shutdown Handler.
 * Closes active HTTP connections and cleanly disconnects database client.
 */
export const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  const forceTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info("HTTP server closed successfully.");
    }

    await disconnectDatabase();
    logger.info("Database connection closed cleanly.");

    clearTimeout(forceTimeout);
    logger.info("Graceful shutdown completed.");
    process.exit(exitCode);
  } catch (err) {
    clearTimeout(forceTimeout);
    logger.error({ err }, "Error during graceful shutdown");
    process.exit(1);
  }
};

/**
 * Main application bootstrap lifecycle.
 */
export const startServer = async (): Promise<Server> => {
  try {
    // 1. Verify and establish database connectivity
    await connectDatabase();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start listening on configured port
    return await new Promise<Server>((resolve) => {
      const runningServer = app.listen(config.PORT, () => {
        server = runningServer;
        logger.info(
          {
            service: APP_NAME,
            version: API_VERSION,
            port: config.PORT,
            mode: config.APP_MODE,
            env: config.NODE_ENV,
          },
          `HTTP server is listening on port ${config.PORT}`
        );
        resolve(runningServer);
      });
    });
  } catch (err) {
    logger.fatal({ err }, "Failed to start HTTP server");
    process.exit(1);
  }
};

// Process-level signal handlers for graceful shutdown
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Unhandled rejection & uncaught exception handlers
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection detected");
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught Exception detected");
  void shutdown("uncaughtException", 1);
});

// Auto-start server when executed directly as entrypoint
if (process.env.NODE_ENV !== "test") {
  void startServer();
}
