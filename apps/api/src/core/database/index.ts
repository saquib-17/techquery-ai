import { PrismaClient } from "@prisma/client";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

// Cache PrismaClient in global scope during development to prevent pool exhaustion on hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (config.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Establishes and verifies database connection.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Database connection established successfully");
  } catch (error) {
    logger.error({ error }, "Failed to connect to PostgreSQL database");
    throw error;
  }
};

/**
 * Gracefully disconnects Prisma client from PostgreSQL.
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info("Database connection disconnected cleanly");
  } catch (error) {
    logger.error({ error }, "Error while disconnecting database");
    throw error;
  }
};

export type { User, Role } from "@prisma/client";
