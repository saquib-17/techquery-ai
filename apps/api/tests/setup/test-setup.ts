import dotenv from "dotenv";

// Load test environment
dotenv.config();

// Ensure test environment is explicitly set
process.env.NODE_ENV = "test";
process.env.AI_PROVIDER = process.env.AI_PROVIDER || "mock";

// If TEST_DATABASE_URL is set, route DATABASE_URL to the isolated test database
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
