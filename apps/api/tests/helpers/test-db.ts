import { prisma } from "../../src/core/database/index.js";

/**
 * Validates that the active database connection is strictly the test database.
 * Throws a fatal exception if executed against the development database.
 */
export const assertTestDatabase = async (): Promise<string> => {
  const result = await prisma.$queryRaw<Array<{ current_database: string }>>`
    SELECT current_database();
  `;

  const dbName = result[0]?.current_database;
  if (!dbName || !dbName.includes("test")) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Test suite attempted to run against non-test database: '${dbName}'. Tests are strictly restricted to 'techquery_test'.`
    );
  }

  return dbName;
};

/**
 * Truncates tables in the test database in dependency order to prevent cross-test contamination.
 */
export const cleanTestDatabase = async (): Promise<void> => {
  await assertTestDatabase();
  await prisma.resumeAnalysis.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.onboardingState.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
};
