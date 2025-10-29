import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { detectEnvironment } from "../../src/detect/env.js";

describe("detectEnvironment", () => {
  const originalEnv = process.env;
  const originalPlatform = process.platform;

  beforeEach(() => {
    // Create a copy of the original env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("detects when inside tmux", () => {
    process.env.TMUX = "/tmp/tmux-session";
    const env = detectEnvironment();
    expect(env.inTmux).toBe(true);
  });

  it("detects when not inside tmux", () => {
    delete process.env.TMUX;
    const env = detectEnvironment();
    expect(env.inTmux).toBe(false);
  });

  it("detects SSH via SSH_TTY", () => {
    process.env.SSH_TTY = "/dev/pts/0";
    const env = detectEnvironment();
    expect(env.inSSH).toBe(true);
  });

  it("detects SSH via SSH_CONNECTION", () => {
    process.env.SSH_CONNECTION = "192.168.1.1 22 192.168.1.2 22";
    const env = detectEnvironment();
    expect(env.inSSH).toBe(true);
  });

  it("detects when not in SSH", () => {
    delete process.env.SSH_TTY;
    delete process.env.SSH_CONNECTION;
    const env = detectEnvironment();
    expect(env.inSSH).toBe(false);
  });

  it("detects macOS platform", () => {
    Object.defineProperty(process, "platform", {
      value: "darwin",
      writable: false,
    });
    const env = detectEnvironment();
    expect(env.isMacOS).toBe(true);
  });

  it("detects non-macOS platform", () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
      writable: false,
    });
    const env = detectEnvironment();
    expect(env.isMacOS).toBe(false);
  });

  it("returns an Environment object with all required properties", () => {
    const env = detectEnvironment();
    expect(env).toHaveProperty("inTmux");
    expect(env).toHaveProperty("inSSH");
    expect(env).toHaveProperty("isMacOS");
    expect(env).toHaveProperty("terminalAppExists");
    expect(env).toHaveProperty("tmuxAvailable");
  });
});
