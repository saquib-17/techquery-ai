/**
 * TechQuery AI API Module Entrypoint
 * Re-exports server lifecycle and app factory.
 */

export { createApp } from "./app.js";
export { startServer, shutdown } from "./server.js";
export * from "./core/config/index.js";
export * from "./core/database/index.js";
export * from "./core/errors/AppError.js";
export * from "./core/responses/index.js";
export * from "./core/logger/index.js";
