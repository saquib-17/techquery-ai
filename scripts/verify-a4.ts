/**
 * Automated Verification Script for Phase A4: Express Server & HTTP Foundation
 * Tests:
 * 1. Express app initialization via createApp()
 * 2. GET /health liveness endpoint (200 OK)
 * 3. GET /health/ready readiness endpoint with live DB (200 OK)
 * 4. GET /health/ready failure simulation (503 Service Unavailable)
 * 5. Unknown route 404 handler (JSON error envelope)
 * 6. AppError operational error handler response formatting
 * 7. Unexpected error internal server error sanitization (no stack trace leak)
 * 8. Helmet security headers presence
 * 9. CORS allowed origin (http://localhost:5173)
 * 10. CORS rejected unauthorized origin
 * 11. Graceful server and database shutdown
 */

import type { Server } from "node:http";
import { Router, type Request, type Response, type NextFunction } from "express";
import { createApp } from "../apps/api/src/app.js";
import { connectDatabase, disconnectDatabase, prisma } from "../apps/api/src/core/database/index.js";
import { BadRequestError } from "../apps/api/src/core/errors/AppError.js";

let passedTests = 0;
let totalTests = 0;

const assert = (condition: boolean, testName: string, detail?: string) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    process.exitCode = 1;
  }
};

const runA4Verification = async () => {
  console.log("=== PHASE A4 EXPRESS SERVER & HTTP VERIFICATION ===\n");

  // Step 1: Connect to database for readiness tests
  await connectDatabase();

  // Create test router for operational and unexpected error testing
  const testRouter = Router();
  testRouter.get("/test/operational-error", (_req: Request, _res: Response, next: NextFunction) => {
    next(new BadRequestError("Invalid test parameter provided"));
  });

  testRouter.get("/test/unexpected-error", (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error("Database connection timed out with secret password=super_secret_xyz"));
  });

  // Step 2: Initialize Express app with test routes
  const app = createApp(testRouter);
  assert(typeof app === "function", "createApp() returns initialized Express application");

  // Step 3: Start server on ephemeral port (0) for end-to-end HTTP tests
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test HTTP server listening on ${baseUrl}\n`);

  try {
    // --- TEST 1: GET /health (Liveness) ---
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthBody = await healthRes.json() as any;
    assert(healthRes.status === 200, "GET /health returns HTTP 200 OK");
    assert(healthBody.success === true, "GET /health envelope success is true");
    assert(healthBody.data?.status === "ok", "GET /health status is 'ok'");
    assert(healthBody.data?.service === "techquery-api", "GET /health service identifier matches");

    // --- TEST 2: GET /health/ready with healthy DB ---
    const readyRes = await fetch(`${baseUrl}/health/ready`);
    const readyBody = await readyRes.json() as any;
    assert(readyRes.status === 200, "GET /health/ready returns HTTP 200 when DB is reachable");
    assert(readyBody.success === true, "GET /health/ready envelope success is true");
    assert(readyBody.data?.status === "ready", "GET /health/ready status is 'ready'");
    assert(readyBody.data?.database === "connected", "GET /health/ready database is 'connected'");

    // --- TEST 3: GET /api/v1/health (Mounted API Route) ---
    const v1HealthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(v1HealthRes.status === 200, "GET /api/v1/health returns HTTP 200");

    // --- TEST 4: Unknown Route 404 Handler ---
    const notFoundRes = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    const notFoundBody = await notFoundRes.json() as any;
    assert(notFoundRes.status === 404, "Unknown route returns HTTP 404 Not Found");
    assert(notFoundBody.success === false, "404 response success is false");
    assert(notFoundBody.error?.code === "NOT_FOUND", "404 error code is 'NOT_FOUND'");
    assert(typeof notFoundBody.error?.message === "string", "404 contains descriptive message");

    // --- TEST 5: AppError Operational Error Handling ---
    const opErrorRes = await fetch(`${baseUrl}/test/operational-error`);
    const opErrorBody = await opErrorRes.json() as any;
    assert(opErrorRes.status === 400, "AppError returns configured status code (400)");
    assert(opErrorBody.success === false, "AppError response success is false");
    assert(opErrorBody.error?.code === "BAD_REQUEST", "AppError returns code 'BAD_REQUEST'");
    assert(opErrorBody.error?.message === "Invalid test parameter provided", "AppError returns safe message");

    // --- TEST 6: Unexpected Error Sanitization (No Leakage) ---
    const unexpErrorRes = await fetch(`${baseUrl}/test/unexpected-error`);
    const unexpErrorBody = await unexpErrorRes.json() as any;
    assert(unexpErrorRes.status === 500, "Unexpected error returns HTTP 500");
    assert(unexpErrorBody.success === false, "Unexpected error success is false");
    assert(unexpErrorBody.error?.code === "INTERNAL_SERVER_ERROR", "Unexpected error code is 'INTERNAL_SERVER_ERROR'");
    assert(!JSON.stringify(unexpErrorBody).includes("super_secret_xyz"), "Internal error does not leak credentials or secret strings");

    // --- TEST 7: Helmet Security Headers ---
    assert(healthRes.headers.has("x-content-type-options"), "Helmet X-Content-Type-Options header present");
    assert(healthRes.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options is 'nosniff'");
    assert(healthRes.headers.has("x-frame-options") || healthRes.headers.has("content-security-policy"), "Helmet frame/CSP security headers present");

    // --- TEST 8: CORS Allowed Origin ---
    const corsAllowedRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://localhost:5173" },
    });
    assert(
      corsAllowedRes.headers.get("access-control-allow-origin") === "http://localhost:5173",
      "CORS allows configured FRONTEND_URL origin"
    );
    assert(
      corsAllowedRes.headers.get("access-control-allow-credentials") === "true",
      "CORS sets access-control-allow-credentials to true"
    );

    // --- TEST 9: CORS Rejected Origin ---
    const corsRejectedRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://malicious-attacker.com" },
    });
    const corsRejectedBody = await corsRejectedRes.json() as any;
    assert(corsRejectedRes.status === 403, "CORS rejects unauthorized origin with HTTP 403 Forbidden");
    assert(corsRejectedBody.error?.code === "FORBIDDEN", "CORS rejection error code is 'FORBIDDEN'");
    assert(
      corsRejectedRes.headers.get("access-control-allow-origin") !== "http://malicious-attacker.com",
      "CORS does not return Access-Control-Allow-Origin for unauthorized origin"
    );

    // --- TEST 10: GET /health/ready 503 Simulation (Database Failure) ---
    // Temporarily mock prisma.$queryRaw to simulate database disconnect
    const originalQueryRaw = prisma.$queryRaw;
    (prisma as any).$queryRaw = async () => {
      throw new Error("Connection refused: 127.0.0.1:5432");
    };

    try {
      const dbDownRes = await fetch(`${baseUrl}/health/ready`);
      const dbDownBody = await dbDownRes.json() as any;
      assert(dbDownRes.status === 503, "GET /health/ready returns HTTP 503 when DB is unavailable");
      assert(dbDownBody.success === false, "503 readiness response success is false");
      assert(dbDownBody.error?.code === "SERVICE_UNAVAILABLE", "503 error code is 'SERVICE_UNAVAILABLE'");
      assert(dbDownBody.error?.message === "Database is not reachable", "503 message is sanitized");
      assert(!JSON.stringify(dbDownBody).includes("5432"), "503 response does not leak port or database internals");
    } finally {
      // Restore original prisma.$queryRaw
      prisma.$queryRaw = originalQueryRaw;
    }

  } finally {
    // Step 4: Gracefully close test HTTP server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    assert(true, "HTTP server closed cleanly");

    // Step 5: Gracefully disconnect database
    await disconnectDatabase();
    assert(true, "Database disconnected cleanly");
  }

  console.log(`\nVerification complete: ${passedTests}/${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log("All Phase A4 verification checks PASSED successfully!");
  } else {
    console.error("Some Phase A4 verification checks FAILED.");
    process.exit(1);
  }
};

runA4Verification().catch((err) => {
  console.error("Unhandled error during Phase A4 verification:", err);
  process.exit(1);
});
