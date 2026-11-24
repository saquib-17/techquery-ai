import express, { type Application, type Request, type Response, type NextFunction, type Router } from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { config } from "./core/config/index.js";
import { logger } from "./core/logger/index.js";
import { notFoundHandler, errorHandler } from "./core/errors/errorHandler.js";
import { ForbiddenError } from "./core/errors/AppError.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { profileRoutes, onboardingRoutes } from "./modules/candidate/candidate.routes.js";
import { resumeRoutes } from "./modules/resume/resume.routes.js";
import { jobDescriptionRoutes } from "./modules/job-description/job-description.routes.js";
import { matchingRoutes } from "./modules/matching/matching.routes.js";
import { questionRoutes } from "./modules/questions/question.routes.js";
import { answerRoutes } from "./modules/answers/answer.routes.js";
import { collectionRoutes } from "./modules/collections/collection.routes.js";
import { usageRoutes } from "./modules/usage/usage.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";

/**
 * Express Application Factory.
 * Configures middleware, security, routes, and centralized error handling.
 * Does not bind to port or start server (enables independent testability).
 */
export const createApp = (customRouter?: Router): Application => {
  const app: Application = express();

  // 1. Helmet Security Headers
  app.use(helmet());

  // 2. Strict CORS Configuration (validated FRONTEND_URL only, no wildcards)
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin, server-side pings)
      if (!origin) {
        return callback(null, true);
      }

      if (origin === config.FRONTEND_URL) {
        return callback(null, true);
      }

      // Reject unapproved origins
      return callback(new ForbiddenError(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  app.use(cors(corsOptions));

  // 3. JSON Request Body Parser with 1MB Payload Limit
  app.use(express.json({ limit: "1mb" }));

  // 4. Cookie Parser Middleware
  app.use(cookieParser());

  // 5. Request Logging Middleware (logs method, path, and duration with Pino)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      };

      if (res.statusCode >= 500) {
        logger.error(logData, `${req.method} ${req.originalUrl} failed with status ${res.statusCode}`);
      } else if (res.statusCode >= 400) {
        logger.warn(logData, `${req.method} ${req.originalUrl} client warning ${res.statusCode}`);
      } else {
        logger.info(logData, `${req.method} ${req.originalUrl} completed in ${durationMs}ms`);
      }
    });

    next();
  });

  // 5. Mount Health & Readiness Routes (Root level & API v1 level)
  app.use("/", healthRoutes);
  app.use("/api/v1", healthRoutes);

  // 6. Mount Feature Modules
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/profile", profileRoutes);
  app.use("/api/v1/onboarding", onboardingRoutes);
  app.use("/api/v1/resumes", resumeRoutes);
  app.use("/api/v1/job-descriptions", jobDescriptionRoutes);
  app.use("/api/v1/matches", matchingRoutes);
  app.use("/api/v1/match", matchingRoutes);
  app.use("/api/v1/questions", questionRoutes);
  app.use("/api/v1/question-sets", questionRoutes);
  app.use("/api/v1/answers", answerRoutes);
  app.use("/api/v1/collections", collectionRoutes);
  app.use("/api/v1/usage", usageRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);

  // Optional custom router for testing or extensions
  if (customRouter) {
    app.use(customRouter);
  }

  // 7. Centralized 404 Route Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler Middleware
  app.use(errorHandler);

  return app;
};
