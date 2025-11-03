import { describe, it, expect } from "vitest";
import { TerminalBackend } from "../../../src/run/macos/terminal.js";
import type { Environment } from "../../../src/types.js";

const mockEnv: Environment = {
  inTmux: false,
  inSSH: false,
  isMacOS: true,
  terminalAppExists: true,
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
  warpAvailable: false,
  inVSCode: false,
  inCursor: false,
  currentTerminal: "Terminal",
};

describe("TerminalBackend", () => {
  it("has correct name", () => {
    const backend = new TerminalBackend();
    expect(backend.name).toBe("terminal");
  });

  it("declares correct capabilities", () => {
    const backend = new TerminalBackend();
    expect(backend.capabilities.pane).toBe(false);
    expect(backend.capabilities.tab).toBe(false);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([]);
    expect(backend.capabilities.experimental).toBe(false);
  });

  it("is available on macOS when Terminal.app exists", () => {
    const backend = new TerminalBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when Terminal.app does not exist", () => {
    const backend = new TerminalBackend();
    const env = { ...mockEnv, terminalAppExists: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available on non-macOS", () => {
    const backend = new TerminalBackend();
    const env = { ...mockEnv, isMacOS: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for window target", () => {
      const backend = new TerminalBackend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.command).toContain("osascript");
      expect(info.command).toContain("tell application");
      expect(info.command).toContain("Terminal");
      expect(info.command).toContain("do script");
      expect(info.description).toContain("Terminal.app");
      expect(info.description).toContain("window");
      expect(info.requiresPermissions).toBe(false);
    });

    it("escapes command properly", () => {
      const backend = new TerminalBackend();
      const info = backend.getDryRunInfo("window", 'echo "test"');

      // Check that the command contains escaped quotes within the osascript
      expect(info.command).toContain('\\"');
    });

    it("indicates pane unsupported in description", () => {
      const backend = new TerminalBackend();
      const info = backend.getDryRunInfo("pane", "echo test");

      expect(info.description).toContain("panes unsupported");
    });
  });

  describe("error messages", () => {
    it("throws helpful error for pane target", () => {
      const backend = new TerminalBackend();
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "Terminal.app does not support pane targets"
      );
    });

    it("throws helpful error for tab target", () => {
      const backend = new TerminalBackend();
      expect(() => backend.runTab("echo test")).toThrow(
        "Terminal.app does not support tab targets"
      );
    });
  });
});
