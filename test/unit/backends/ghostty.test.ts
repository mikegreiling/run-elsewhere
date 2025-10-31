import { describe, it, expect } from "vitest";
import { GhosttyBackend } from "../../../src/run/macos/ghostty.js";
import type { Environment } from "../../../src/types.js";

const mockEnv: Environment = {
  inTmux: false,
  inSSH: false,
  isMacOS: true,
  terminalAppExists: false,
  tmuxAvailable: false,
  inZellij: false,
  zellijAvailable: false,
  inITerm2: false,
  iTerm2Available: false,
  inKitty: false,
  kittyAvailable: false,
  inGhostty: false,
  ghosttyAvailable: true,
  inWarp: false,
  warpAvailable: false,
  inVSCode: false,
  inCursor: false,
  currentTerminal: "Ghostty",
};

describe("GhosttyBackend", () => {
  it("has correct name", () => {
    const backend = new GhosttyBackend();
    expect(backend.name).toBe("Ghostty");
  });

  it("declares correct capabilities including experimental flag", () => {
    const backend = new GhosttyBackend();
    expect(backend.capabilities.pane).toBe(false);
    expect(backend.capabilities.tab).toBe(true);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([]);
    expect(backend.capabilities.experimental).toBe(true);
  });

  it("is available on macOS when Ghostty exists", () => {
    const backend = new GhosttyBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when Ghostty does not exist", () => {
    const backend = new GhosttyBackend();
    const env = { ...mockEnv, ghosttyAvailable: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available on non-macOS", () => {
    const backend = new GhosttyBackend();
    const env = { ...mockEnv, isMacOS: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for tab target with experimental warning", () => {
      const backend = new GhosttyBackend();
      const info = backend.getDryRunInfo("tab", "echo test");

      expect(info.command).toContain("osascript");
      expect(info.description).toContain("Ghostty");
      expect(info.description).toContain("experimental");
      expect(info.description).toContain("Accessibility permissions");
      expect(info.requiresPermissions).toBe(true);
    });

    it("returns correct info for window target with experimental warning", () => {
      const backend = new GhosttyBackend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.description).toContain("experimental");
      expect(info.requiresPermissions).toBe(true);
    });
  });

  describe("error messages", () => {
    it("throws helpful error for pane target", () => {
      const backend = new GhosttyBackend();
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "Ghostty does not support pane targets"
      );
    });
  });
});
