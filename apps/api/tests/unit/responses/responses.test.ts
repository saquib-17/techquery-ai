import { describe, it, expect, vi } from "vitest";
import { sendSuccess, sendError } from "../../../src/core/responses/index.js";
import type { Response } from "express";

describe("API Response Utilities Unit Tests", () => {
  it("should send standardized success envelope", () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockRes = { status: mockStatus } as unknown as Response;

    const data = { id: "123", name: "TechQuery" };
    sendSuccess(mockRes, data, 201);

    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data,
    });
  });

  it("should send standardized error envelope", () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockRes = { status: mockStatus } as unknown as Response;

    sendError(mockRes, 404, "NOT_FOUND", "Resource missing");

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource missing",
      },
    });
  });
});
