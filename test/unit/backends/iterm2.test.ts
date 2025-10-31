import { describe, it, expect } from "vitest";
import { ITerm2Backend } from "../../../src/run/macos/iterm2.js";
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
  iTerm2Available: true,
  inKitty: false,
  kittyAvailable: false,
  inGhostty: false,
  ghosttyAvailable: false,
  inWarp: false,
  warpAvailable: false,
  inVSCode: false,
  inCursor: false,
  currentTerminal: "iTerm2",
};

describe("ITerm2Backend", () => {
  it("has correct name", () => {
    const backend = new ITerm2Backend();
    expect(backend.name).toBe("iTerm2");
  });

  it("declares correct capabilities", () => {
    const backend = new ITerm2Backend();
    expect(backend.capabilities.pane).toBe(false);
    expect(backend.capabilities.tab).toBe(true);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([]);
    expect(backend.capabilities.experimental).toBe(false);
  });

  it("is available on macOS when iTerm2 exists", () => {
    const backend = new ITerm2Backend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when iTerm2 does not exist", () => {
    const backend = new ITerm2Backend();
    const env = { ...mockEnv, iTerm2Available: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available on non-macOS", () => {
    const backend = new ITerm2Backend();
    const env = { ...mockEnv, isMacOS: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for tab target", () => {
      const backend = new ITerm2Backend();
      const info = backend.getDryRunInfo("tab", "echo test");

      expect(info.command).toContain("osascript");
      expect(info.command).toContain("tell application");
      expect(info.command).toContain("iTerm");
      expect(info.description).toContain("iTerm2");
      expect(info.description).toContain("tab");
      expect(info.requiresPermissions).toBe(false);
    });

    it("returns correct info for window target", () => {
      const backend = new ITerm2Backend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.command).toContain("osascript");
      expect(info.description).toContain("iTerm2");
      expect(info.description).toContain("window");
    });

    it("escapes command properly", () => {
      const backend = new ITerm2Backend();
      const info = backend.getDryRunInfo("tab", 'echo "test"');

      // Check that the command contains escaped quotes within the osascript
      expect(info.command).toContain('\\"');
    });
  });

  describe("error messages", () => {
    it("throws helpful error for pane target with future work note", () => {
      const backend = new ITerm2Backend();
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "iTerm2 pane support not yet implemented"
      );
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "future iteration"
      );
    });
  });
});
