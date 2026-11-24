import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Candidate Profile & Onboarding API Integration Tests", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const u1 = await prisma.user.create({
      data: {
        name: "User One",
        email: "user1@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({ userId: u1.id, role: u1.role, tier: u1.tier });

    const u2 = await prisma.user.create({
      data: {
        name: "User Two",
        email: "user2@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({ userId: u2.id, role: u2.role, tier: u2.tier });
  });

  // --- PROFILE TESTS ---

  it("1. creates candidate profile with 201 Created and advances onboarding to RESUME", async () => {
    const res = await request(app)
      .post("/api/v1/profile")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        fullName: "Jane Doe",
        phoneNumber: "+1 555-0199",
        headline: "Senior Full Stack Engineer",
        currentRole: "Lead Developer",
        yearsOfExperience: 6,
        highestEducation: "B.Tech Computer Science",
        university: "Tech Institute",
        graduationYear: 2018,
        linkedinUrl: "https://linkedin.com/in/janedoe",
        githubUrl: "https://github.com/janedoe",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.fullName).toBe("Jane Doe");
    expect(res.body.data.profile.yearsOfExperience).toBe(6);

    // Verify DB
    const dbProfile = await prisma.candidateProfile.findUnique({ where: { userId: user1Id } });
    expect(dbProfile).toBeDefined();
    expect(dbProfile?.fullName).toBe("Jane Doe");

    // Verify onboarding state advanced to RESUME
    const onboarding = await prisma.onboardingState.findUnique({ where: { userId: user1Id } });
    expect(onboarding?.onboardingStep).toBe("RESUME");
    expect(onboarding?.onboardingCompleted).toBe(false);
  });

  it("2. retrieves authenticated candidate profile", async () => {
    await prisma.candidateProfile.create({
      data: {
        userId: user1Id,
        fullName: "Existing Jane",
        headline: "Software Engineer",
      },
    });

    const res = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.fullName).toBe("Existing Jane");
  });

  it("3. rejects duplicate profile creation with 409 Conflict", async () => {
    await prisma.candidateProfile.create({
      data: {
        userId: user1Id,
        fullName: "Existing Jane",
      },
    });

    const res = await request(app)
      .post("/api/v1/profile")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        fullName: "Duplicate Attempt",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROFILE_ALREADY_EXISTS");
  });

  it("4. updates existing candidate profile with PATCH /api/v1/profile", async () => {
    await prisma.candidateProfile.create({
      data: {
        userId: user1Id,
        fullName: "Jane Before",
        headline: "Junior Dev",
      },
    });

    const res = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        headline: "Senior Dev",
        yearsOfExperience: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.headline).toBe("Senior Dev");
    expect(res.body.data.profile.yearsOfExperience).toBe(5);
    expect(res.body.data.profile.fullName).toBe("Jane Before");
  });

  it("5. rejects unauthorized profile access without Bearer token with 401", async () => {
    const res = await request(app).get("/api/v1/profile");
    expect(res.status).toBe(401);
  });

  it("6. validates profile input fields with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/v1/profile")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        fullName: "A", // too short
        yearsOfExperience: -1, // negative
        linkedinUrl: "not-a-url",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // --- ONBOARDING TESTS ---

  it("7. retrieves initial onboarding state with default PROFILE step", async () => {
    const res = await request(app)
      .get("/api/v1/onboarding")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.onboarding.onboardingCompleted).toBe(false);
    expect(res.body.data.onboarding.onboardingStep).toBe("PROFILE");
  });

  it("8. rejects completing onboarding if candidate profile is missing", async () => {
    const res = await request(app)
      .patch("/api/v1/onboarding")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        markCompleted: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("PROFILE_INCOMPLETE");
  });

  it("9. allows completing onboarding when profile exists", async () => {
    await prisma.candidateProfile.create({
      data: {
        userId: user1Id,
        fullName: "Ready User",
      },
    });

    const res = await request(app)
      .patch("/api/v1/onboarding")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        markCompleted: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.onboarding.onboardingCompleted).toBe(true);
    expect(res.body.data.onboarding.onboardingStep).toBe("COMPLETED");
    expect(res.body.data.onboarding.onboardingCompletedAt).toBeDefined();
  });
});
