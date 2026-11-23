import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, connectDatabase, disconnectDatabase } from "../../../src/core/database/index.js";
import { assertTestDatabase } from "../../helpers/test-db.js";
import { Prisma } from "@prisma/client";

describe("Database Integration & Least-Privilege Tests", () => {
  let createdUserId: string | null = null;
  const testEmail = `integration.test.${Date.now()}@techquery.local`;

  beforeAll(async () => {
    await connectDatabase();
    // Strict safety guard: verifies target database is techquery_test
    const dbName = await assertTestDatabase();
    expect(dbName).toBe("techquery_test");
  });

  afterAll(async () => {
    // Teardown: ensure temporary test user is cleaned up
    if (createdUserId) {
      await prisma.user.deleteMany({
        where: { id: createdUserId },
      });
    }
    await disconnectDatabase();
  });

  it("should execute lightweight connectivity probe (SELECT 1)", async () => {
    const ping = await prisma.$queryRaw<Array<{ ping: number }>>`SELECT 1 as ping`;
    expect(ping[0]?.ping).toBe(1);
  });

  it("should allow runtime role to CREATE a temporary user record", async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy_test_hash",
        role: "CANDIDATE",
      },
    });

    createdUserId = user.id;

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe("CANDIDATE");
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("should allow runtime role to SELECT and retrieve the created user", async () => {
    expect(createdUserId).not.toBeNull();

    const fetched = await prisma.user.findUnique({
      where: { id: createdUserId! },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(createdUserId);
    expect(fetched?.email).toBe(testEmail);
  });

  it("should allow runtime role to UPDATE user data", async () => {
    expect(createdUserId).not.toBeNull();

    const updated = await prisma.user.update({
      where: { id: createdUserId! },
      data: { role: "ADMIN" },
    });

    expect(updated.role).toBe("ADMIN");
  });

  it("should reject duplicate email with Prisma unique constraint code P2002", async () => {
    let duplicateCaught = false;

    try {
      await prisma.user.create({
        data: {
          email: testEmail, // duplicate
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy_test_hash_2",
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        duplicateCaught = true;
      }
    }

    expect(duplicateCaught).toBe(true);
  });

  it("should allow runtime role to DELETE user record cleanly", async () => {
    expect(createdUserId).not.toBeNull();

    await prisma.user.delete({
      where: { id: createdUserId! },
    });

    const check = await prisma.user.findUnique({
      where: { id: createdUserId! },
    });

    expect(check).toBeNull();
    createdUserId = null; // Mark cleaned up
  });

  it("should DENY runtime role from creating tables (42501 insufficient_privilege)", async () => {
    let blocked = false;

    try {
      await prisma.$executeRawUnsafe(`CREATE TABLE unauthorized_test (id int);`);
    } catch (err: any) {
      if (err.message?.includes("42501") || err.message?.includes("permission denied")) {
        blocked = true;
      }
    }

    expect(blocked).toBe(true);
  });

  it("should DENY runtime role from altering tables (42501 must be table owner)", async () => {
    let blocked = false;

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN unauthorized_col text;`);
    } catch (err: any) {
      if (err.message?.includes("42501") || err.message?.includes("must be owner") || err.message?.includes("permission denied")) {
        blocked = true;
      }
    }

    expect(blocked).toBe(true);
  });
});
