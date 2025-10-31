import { describe, it, expect } from "vitest";
import { WarpBackend } from "../../../src/run/macos/warp.js";
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
  ghosttyAvailable: false,
  inWarp: false,
  warpAvailable: true,
  inVSCode: false,
  inCursor: false,
  currentTerminal: "Warp",
};

describe("WarpBackend", () => {
  it("has correct name", () => {
    const backend = new WarpBackend();
    expect(backend.name).toBe("Warp");
  });

  it("declares correct capabilities including experimental flag", () => {
    const backend = new WarpBackend();
    expect(backend.capabilities.pane).toBe(false);
    expect(backend.capabilities.tab).toBe(true);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([]);
    expect(backend.capabilities.experimental).toBe(true);
  });

  it("is available on macOS when Warp exists", () => {
    const backend = new WarpBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when Warp does not exist", () => {
    const backend = new WarpBackend();
    const env = { ...mockEnv, warpAvailable: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available on non-macOS", () => {
    const backend = new WarpBackend();
    const env = { ...mockEnv, isMacOS: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for tab target with experimental warning", () => {
      const backend = new WarpBackend();
      const info = backend.getDryRunInfo("tab", "echo test");

      expect(info.command).toContain("osascript");
      expect(info.description).toContain("Warp");
      expect(info.description).toContain("experimental");
      expect(info.description).toContain("Accessibility permissions");
      expect(info.requiresPermissions).toBe(true);
    });

    it("returns correct info for window target with experimental warning", () => {
      const backend = new WarpBackend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.description).toContain("experimental");
      expect(info.requiresPermissions).toBe(true);
    });
  });

  describe("error messages", () => {
    it("throws helpful error for pane target", () => {
      const backend = new WarpBackend();
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "Warp does not support pane targets"
      );
    });
  });
});
