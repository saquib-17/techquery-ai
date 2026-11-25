import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { api, setAccessToken, getAccessToken } from "@/lib/api";

describe("Axios Single-Flight Refresh Interceptor (Phase F2)", () => {
  beforeEach(() => {
    setAccessToken("expired-access-token");
  });

  it("coalesces 3 concurrent 401 responses into a single /auth/refresh call and retries all 3 requests", async () => {
    let refreshCallCount = 0;

    const mockAdapter: AxiosAdapter = vi.fn(
      async (config: InternalAxiosRequestConfig) => {
        const url = config.url || "";

        if (url.endsWith("/auth/refresh")) {
          refreshCallCount += 1;
          // Simulate async refresh latency so concurrent 401s queue up
          await new Promise((r) => setTimeout(r, 25));
          return {
            data: {
              success: true,
              data: { accessToken: "fresh-access-token" },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
        }

        const authHeader = config.headers?.Authorization;
        if (authHeader === "Bearer fresh-access-token") {
          return {
            data: { success: true, data: { ok: true, url } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
        }

        // Reject with 401 for expired token
        const err = Object.assign(new Error("Unauthorized"), {
          isAxiosError: true,
          config,
          response: {
            status: 401,
            data: {
              success: false,
              error: { code: "TOKEN_EXPIRED", message: "Access token expired" },
            },
          },
        });
        throw err;
      }
    );

    api.defaults.adapter = mockAdapter;

    // Fire 3 concurrent requests simultaneously
    const [res1, res2, res3] = await Promise.all([
      api.get("/resumes"),
      api.get("/job-descriptions"),
      api.get("/dashboard/summary"),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(getAccessToken()).toBe("fresh-access-token");
    expect(res1.data.data.ok).toBe(true);
    expect(res2.data.data.ok).toBe(true);
    expect(res3.data.data.ok).toBe(true);
  });
});
