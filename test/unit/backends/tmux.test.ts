import { describe, it, expect } from "vitest";
import { TmuxBackend } from "../../../src/run/tmux.js";
import type { Environment } from "../../../src/types.js";

const mockEnv: Environment = {
  inTmux: true,
  inSSH: false,
  isMacOS: true,
  terminalAppExists: false,
  tmuxAvailable: true,
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
  currentTerminal: "unknown",
};

describe("TmuxBackend", () => {
  it("has correct name", () => {
    const backend = new TmuxBackend();
    expect(backend.name).toBe("tmux");
  });

  it("declares correct capabilities", () => {
    const backend = new TmuxBackend();
    expect(backend.capabilities.pane).toBe(true);
    expect(backend.capabilities.tab).toBe(true);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([
      "left",
      "right",
      "up",
      "down",
    ]);
    expect(backend.capabilities.experimental).toBe(false);
  });

  it("is available when in tmux with tmux available", () => {
    const backend = new TmuxBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when not in tmux", () => {
    const backend = new TmuxBackend();
    const env = { ...mockEnv, inTmux: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available when tmux not available", () => {
    const backend = new TmuxBackend();
    const env = { ...mockEnv, tmuxAvailable: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for pane target", () => {
      const backend = new TmuxBackend();
      const info = backend.getDryRunInfo("pane", "echo test", "right");

      expect(info.command).toContain("tmux split-window");
      expect(info.command).toContain("tmux send-keys");
      expect(info.description).toContain("tmux pane");
      expect(info.description).toContain("right");
      expect(info.requiresPermissions).toBe(false);
    });

    it("includes correct direction flags in command", () => {
      const backend = new TmuxBackend();

      const rightInfo = backend.getDryRunInfo("pane", "echo test", "right");
      expect(rightInfo.command).toContain("-h");
      expect(rightInfo.command).not.toContain("-b");

      const leftInfo = backend.getDryRunInfo("pane", "echo test", "left");
      expect(leftInfo.command).toContain("-h -b");

      const downInfo = backend.getDryRunInfo("pane", "echo test", "down");
      expect(downInfo.command).toContain("-v");
      expect(downInfo.command).not.toContain("-b");

      const upInfo = backend.getDryRunInfo("pane", "echo test", "up");
      expect(upInfo.command).toContain("-v -b");
    });

    it("escapes command properly", () => {
      const backend = new TmuxBackend();
      const info = backend.getDryRunInfo("pane", 'echo "test"', "right");

      expect(info.command).toContain('\\"');
    });
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for tab target", () => {
      const backend = new TmuxBackend();
      const info = backend.getDryRunInfo("tab", "echo test");

      expect(info.command).toContain("tmux new-window");
      expect(info.description).toContain("tmux window");
      expect(info.requiresPermissions).toBe(false);
    });

    it("returns correct info for window target", () => {
      const backend = new TmuxBackend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.command).toBeDefined();
      // When TERM_PROGRAM is not set, falls back to tmux window
      expect(
        info.description.includes("Ghostty window") ||
          info.description.includes("new window (delegation failed")
      ).toBe(true);
      expect(info.requiresPermissions).toBe(false);
    });
  });
});
