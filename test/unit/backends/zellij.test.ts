import { describe, it, expect } from "vitest";
import { ZellijBackend } from "../../../src/run/zellij.js";
import type { Environment } from "../../../src/types.js";

const mockEnv: Environment = {
  inTmux: false,
  inSSH: false,
  isMacOS: true,
  terminalAppExists: false,
  tmuxAvailable: false,
  inZellij: true,
  zellijAvailable: true,
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

describe("ZellijBackend", () => {
  it("has correct name", () => {
    const backend = new ZellijBackend();
    expect(backend.name).toBe("zellij");
  });

  it("declares correct capabilities", () => {
    const backend = new ZellijBackend();
    expect(backend.capabilities.pane).toBe(true);
    expect(backend.capabilities.tab).toBe(false);
    expect(backend.capabilities.window).toBe(false);
    expect(backend.capabilities.directions).toEqual([
      "left",
      "right",
      "up",
      "down",
    ]);
    expect(backend.capabilities.experimental).toBe(false);
  });

  it("is available when in zellij with zellij available", () => {
    const backend = new ZellijBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when not in zellij", () => {
    const backend = new ZellijBackend();
    const env = { ...mockEnv, inZellij: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  it("is not available when zellij not available", () => {
    const backend = new ZellijBackend();
    const env = { ...mockEnv, zellijAvailable: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for pane target", () => {
      const backend = new ZellijBackend();
      const info = backend.getDryRunInfo("pane", "echo test", "right");

      expect(info.command).toContain("zellij action new-pane");
      expect(info.command).toContain("zellij action write-chars");
      expect(info.command).toContain("zellij action write 13");
      expect(info.description).toContain("zellij pane");
      expect(info.description).toContain("right");
      expect(info.requiresPermissions).toBe(false);
    });

    it("maps directions correctly", () => {
      const backend = new ZellijBackend();

      const rightInfo = backend.getDryRunInfo("pane", "echo test", "right");
      expect(rightInfo.command).toContain('"Right"');

      const leftInfo = backend.getDryRunInfo("pane", "echo test", "left");
      expect(leftInfo.command).toContain('"Left"');

      const downInfo = backend.getDryRunInfo("pane", "echo test", "down");
      expect(downInfo.command).toContain('"Down"');

      const upInfo = backend.getDryRunInfo("pane", "echo test", "up");
      expect(upInfo.command).toContain('"Up"');
    });

    it("escapes command properly", () => {
      const backend = new ZellijBackend();
      const info = backend.getDryRunInfo("pane", 'echo "test"', "right");

      expect(info.command).toContain('\\"');
    });
  });

  describe("error messages", () => {
    it("throws helpful error for tab target", () => {
      const backend = new ZellijBackend();
      expect(() => backend.runTab("echo test")).toThrow(
        "zellij does not support tab targets"
      );
    });

    it("throws helpful error for window target", () => {
      const backend = new ZellijBackend();
      expect(() => backend.runWindow("echo test")).toThrow(
        "zellij does not support window targets"
      );
    });
  });
});
