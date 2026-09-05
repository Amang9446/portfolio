import { describe, expect, it } from "vitest";
import {
  adminErrorUrl,
  adminNoticeUrl,
  resolveAdminErrorMessage,
} from "./admin-feedback";

describe("admin-feedback", () => {
  it("generates notice URLs correctly", () => {
    expect(adminNoticeUrl("/admin/posts", "post-created")).toBe(
      "/admin/posts?notice=post-created",
    );
  });

  it("generates safe error URLs with codes", () => {
    expect(adminErrorUrl("/admin/posts", "post-save-failed")).toBe(
      "/admin/posts?error=post-save-failed",
    );
  });

  it("resolves recognized error codes to friendly strings", () => {
    expect(resolveAdminErrorMessage("invalid-login")).toBe(
      "Invalid email or password.",
    );
    expect(resolveAdminErrorMessage("current-password-incorrect")).toBe(
      "Current password is incorrect.",
    );
    expect(resolveAdminErrorMessage("post-save-failed")).toBe(
      "Failed to save post. Please check the logs.",
    );
  });

  it("handles null or undefined codes", () => {
    expect(resolveAdminErrorMessage(null)).toBeNull();
    expect(resolveAdminErrorMessage(undefined)).toBeNull();
    expect(resolveAdminErrorMessage("")).toBeNull();
  });

  it("maps unknown or unrecognized error codes to generic-error", () => {
    expect(resolveAdminErrorMessage("unrecognized_code_123")).toBe(
      "An unexpected error occurred. Please try again.",
    );
    expect(
      resolveAdminErrorMessage("Your session expired, call 555-0100"),
    ).toBe("An unexpected error occurred. Please try again.");
    expect(resolveAdminErrorMessage("generic-error")).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });
});
