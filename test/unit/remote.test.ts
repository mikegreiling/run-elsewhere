import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isRemoteSession } from "../../src/detect/remote.js";

describe("isRemoteSession", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a clean env for each test
    process.env = {};
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("detects SSH session via SSH_TTY", () => {
    process.env.SSH_TTY = "/dev/pts/0";
    expect(isRemoteSession()).toBe(true);
  });

  it("detects SSH session via SSH_CONNECTION", () => {
    process.env.SSH_CONNECTION = "192.168.1.1 22 192.168.1.2 22";
    expect(isRemoteSession()).toBe(true);
  });

  it("detects Mosh session", () => {
    process.env.MOSH_CONNECTION = "remote.server";
    expect(isRemoteSession()).toBe(true);
  });

  it("returns false when no remote indicators", () => {
    expect(isRemoteSession()).toBe(false);
  });

  it("returns true when SSH_TTY is set (takes precedence)", () => {
    process.env.SSH_TTY = "/dev/pts/0";
    process.env.MOSH_CONNECTION = ""; // Empty doesn't count
    expect(isRemoteSession()).toBe(true);
  });
});
