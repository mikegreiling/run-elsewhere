import { describe, it, expect } from "vitest";
import { KittyBackend } from "../../../src/run/cli/kitty.js";
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
  kittyAvailable: true,
  inGhostty: false,
  ghosttyAvailable: false,
  inWarp: false,
  warpAvailable: false,
  inVSCode: false,
  inCursor: false,
  currentTerminal: "kitty",
};

describe("KittyBackend", () => {
  it("has correct name", () => {
    const backend = new KittyBackend();
    expect(backend.name).toBe("kitty");
  });

  it("declares correct capabilities", () => {
    const backend = new KittyBackend();
    expect(backend.capabilities.pane).toBe(false);
    expect(backend.capabilities.tab).toBe(true);
    expect(backend.capabilities.window).toBe(true);
    expect(backend.capabilities.directions).toEqual([]);
    expect(backend.capabilities.experimental).toBe(false);
  });

  it("is available when kitty binary exists", () => {
    const backend = new KittyBackend();
    expect(backend.isAvailable(mockEnv)).toBe(true);
  });

  it("is not available when kitty binary does not exist", () => {
    const backend = new KittyBackend();
    const env = { ...mockEnv, kittyAvailable: false };
    expect(backend.isAvailable(env)).toBe(false);
  });

  describe("getDryRunInfo", () => {
    it("returns correct info for tab target", () => {
      const backend = new KittyBackend();
      const info = backend.getDryRunInfo("tab", "echo test");

      expect(info.command).toContain("kitty @");
      expect(info.command).toContain("--type=tab");
      expect(info.description).toContain("kitty");
      expect(info.description).toContain("tab");
      expect(info.requiresPermissions).toBe(false);
    });

    it("returns correct info for window target", () => {
      const backend = new KittyBackend();
      const info = backend.getDryRunInfo("window", "echo test");

      expect(info.command).toContain("kitty @");
      expect(info.command).toContain("--type=os-window");
      expect(info.description).toContain("kitty");
      expect(info.description).toContain("window");
    });

    it("escapes command properly for shell", () => {
      const backend = new KittyBackend();
      const info = backend.getDryRunInfo("tab", 'echo "test" $VAR `cmd`');

      expect(info.command).toContain('\\"');
      expect(info.command).toContain('\\$');
      expect(info.command).toContain('\\`');
    });
  });

  describe("error messages", () => {
    it("throws helpful error for pane target", () => {
      const backend = new KittyBackend();
      expect(() => backend.runPane("echo test", "right")).toThrow(
        "kitty does not support pane targets"
      );
    });
  });
});
