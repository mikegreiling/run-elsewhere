import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  detectCurrentTerminal,
  isUnsupportedTerminal,
  isExperimentalTerminal,
} from "../../src/detect/terminal.js";

describe("detectCurrentTerminal", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment before each test
    process.env = { ...originalEnv };
    delete process.env.TERM_PROGRAM;
    delete process.env.LC_TERMINAL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("via TERM_PROGRAM", () => {
    it("detects iTerm2 from TERM_PROGRAM=iTerm.app", () => {
      process.env.TERM_PROGRAM = "iTerm.app";
      expect(detectCurrentTerminal()).toBe("iTerm2");
    });

    it("detects Terminal.app from TERM_PROGRAM=Apple_Terminal", () => {
      process.env.TERM_PROGRAM = "Apple_Terminal";
      expect(detectCurrentTerminal()).toBe("Terminal");
    });

    it("detects VSCode from TERM_PROGRAM=vscode", () => {
      process.env.TERM_PROGRAM = "vscode";
      expect(detectCurrentTerminal()).toBe("VSCode");
    });

    it("detects Cursor from TERM_PROGRAM=cursor", () => {
      process.env.TERM_PROGRAM = "Cursor";
      expect(detectCurrentTerminal()).toBe("Cursor");
    });

    it("detects kitty from TERM_PROGRAM=kitty", () => {
      process.env.TERM_PROGRAM = "kitty";
      expect(detectCurrentTerminal()).toBe("kitty");
    });

    it("detects Ghostty from TERM_PROGRAM=ghostty", () => {
      process.env.TERM_PROGRAM = "ghostty";
      expect(detectCurrentTerminal()).toBe("Ghostty");
    });

    it("detects Warp from TERM_PROGRAM=warp", () => {
      process.env.TERM_PROGRAM = "warp";
      expect(detectCurrentTerminal()).toBe("Warp");
    });

    it("returns unknown for unrecognized TERM_PROGRAM", () => {
      process.env.TERM_PROGRAM = "some-unknown-terminal";
      expect(detectCurrentTerminal()).toBe("unknown");
    });
  });

  describe("via LC_TERMINAL fallback", () => {
    it("detects iTerm2 from LC_TERMINAL containing iterm", () => {
      process.env.LC_TERMINAL = "iTerm2";
      expect(detectCurrentTerminal()).toBe("iTerm2");
    });

    it("detects Terminal from LC_TERMINAL containing terminal", () => {
      process.env.LC_TERMINAL = "Terminal";
      expect(detectCurrentTerminal()).toBe("Terminal");
    });

    it("detects kitty from LC_TERMINAL", () => {
      process.env.LC_TERMINAL = "kitty";
      expect(detectCurrentTerminal()).toBe("kitty");
    });
  });

  describe("case insensitivity", () => {
    it("handles lowercase term_program values", () => {
      process.env.TERM_PROGRAM = "iterm.app";
      expect(detectCurrentTerminal()).toBe("iTerm2");
    });

    it("handles uppercase term_program values", () => {
      process.env.TERM_PROGRAM = "VSCODE";
      expect(detectCurrentTerminal()).toBe("VSCode");
    });
  });

  describe("no detection", () => {
    it("returns unknown when no env vars set", () => {
      expect(detectCurrentTerminal()).toBe("unknown");
    });
  });
});

describe("isUnsupportedTerminal", () => {
  it("returns true for VSCode", () => {
    expect(isUnsupportedTerminal("VSCode")).toBe(true);
  });

  it("returns true for Cursor", () => {
    expect(isUnsupportedTerminal("Cursor")).toBe(true);
  });

  it("returns true for unknown", () => {
    expect(isUnsupportedTerminal("unknown")).toBe(true);
  });

  it("returns false for Terminal", () => {
    expect(isUnsupportedTerminal("Terminal")).toBe(false);
  });

  it("returns false for iTerm2", () => {
    expect(isUnsupportedTerminal("iTerm2")).toBe(false);
  });

  it("returns false for kitty", () => {
    expect(isUnsupportedTerminal("kitty")).toBe(false);
  });

  it("returns false for Ghostty", () => {
    expect(isUnsupportedTerminal("Ghostty")).toBe(false);
  });

  it("returns false for Warp", () => {
    expect(isUnsupportedTerminal("Warp")).toBe(false);
  });
});

describe("isExperimentalTerminal", () => {
  it("returns true for Ghostty", () => {
    expect(isExperimentalTerminal("Ghostty")).toBe(true);
  });

  it("returns true for Warp", () => {
    expect(isExperimentalTerminal("Warp")).toBe(true);
  });

  it("returns false for Terminal", () => {
    expect(isExperimentalTerminal("Terminal")).toBe(false);
  });

  it("returns false for iTerm2", () => {
    expect(isExperimentalTerminal("iTerm2")).toBe(false);
  });

  it("returns false for kitty", () => {
    expect(isExperimentalTerminal("kitty")).toBe(false);
  });

  it("returns false for VSCode", () => {
    expect(isExperimentalTerminal("VSCode")).toBe(false);
  });

  it("returns false for Cursor", () => {
    expect(isExperimentalTerminal("Cursor")).toBe(false);
  });

  it("returns false for unknown", () => {
    expect(isExperimentalTerminal("unknown")).toBe(false);
  });
});
