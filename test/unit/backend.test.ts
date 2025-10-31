import { describe, it, expect } from "vitest";
import { BaseBackend, type BackendCapabilities } from "../../src/run/backend.js";
import type { BackendType, TargetType, SplitDirection } from "../../src/types.js";
import type { Environment } from "../../src/types.js";

// Test implementation of BaseBackend
class TestBackend extends BaseBackend {
  name: BackendType = "tmux";
  capabilities: BackendCapabilities = {
    pane: true,
    tab: false,
    window: false,
    directions: ["left", "right", "up", "down"],
    experimental: false,
  };

  paneCallCount = 0;
  tabCallCount = 0;
  windowCallCount = 0;
  lastCommand?: string;
  lastDirection?: SplitDirection;

  isAvailable(_env: Environment): boolean {
    return true;
  }

  runPane(command: string, direction: SplitDirection): void {
    this.paneCallCount++;
    this.lastCommand = command;
    this.lastDirection = direction;
  }

  runTab(command: string): void {
    this.tabCallCount++;
    this.lastCommand = command;
  }

  runWindow(command: string): void {
    this.windowCallCount++;
    this.lastCommand = command;
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): any {
    return {
      command: `dry-run: ${target} ${command} ${direction || ""}`,
      description: `Test ${target}`,
      requiresPermissions: false,
    };
  }
}

describe("BaseBackend", () => {
  describe("run() method routing", () => {
    it("routes to runPane when target is pane", () => {
      const backend = new TestBackend();
      backend["run"]("pane", "echo test", "right");

      expect(backend.paneCallCount).toBe(1);
      expect(backend.tabCallCount).toBe(0);
      expect(backend.windowCallCount).toBe(0);
      expect(backend.lastCommand).toBe("echo test");
      expect(backend.lastDirection).toBe("right");
    });

    it("routes to runTab when target is tab", () => {
      const backend = new TestBackend();
      backend.capabilities.tab = true;
      backend["run"]("tab", "echo test");

      expect(backend.paneCallCount).toBe(0);
      expect(backend.tabCallCount).toBe(1);
      expect(backend.windowCallCount).toBe(0);
      expect(backend.lastCommand).toBe("echo test");
    });

    it("routes to runWindow when target is window", () => {
      const backend = new TestBackend();
      backend.capabilities.window = true;
      backend["run"]("window", "echo test");

      expect(backend.paneCallCount).toBe(0);
      expect(backend.tabCallCount).toBe(0);
      expect(backend.windowCallCount).toBe(1);
      expect(backend.lastCommand).toBe("echo test");
    });

    it("throws error when pane target unsupported", () => {
      const backend = new TestBackend();
      backend.capabilities.pane = false;

      expect(() => backend["run"]("pane", "echo test", "right")).toThrow(
        "does not support pane targets"
      );
    });

    it("throws error when tab target unsupported", () => {
      const backend = new TestBackend();
      backend.capabilities.tab = false;

      expect(() => backend["run"]("tab", "echo test")).toThrow(
        "does not support tab targets"
      );
    });

    it("throws error when window target unsupported", () => {
      const backend = new TestBackend();
      backend.capabilities.window = false;

      expect(() => backend["run"]("window", "echo test")).toThrow(
        "does not support window targets"
      );
    });

    it("throws error when direction not provided for pane", () => {
      const backend = new TestBackend();

      expect(() => backend["run"]("pane", "echo test")).toThrow(
        "Direction required for pane target"
      );
    });
  });

  describe("formatCommandForDescription()", () => {
    it("returns command as-is when under max length", () => {
      const backend = new TestBackend();
      const result = backend["formatCommandForDescription"]("echo test", 60);
      expect(result).toBe("echo test");
    });

    it("truncates command when over max length", () => {
      const backend = new TestBackend();
      const longCommand = "a".repeat(100);
      const result = backend["formatCommandForDescription"](longCommand, 60);

      expect(result).toHaveLength(60);
      expect(result.endsWith("...")).toBe(true);
      expect(result).toBe("a".repeat(57) + "...");
    });

    it("uses default max length of 60", () => {
      const backend = new TestBackend();
      const longCommand = "a".repeat(100);
      const result = backend["formatCommandForDescription"](longCommand);

      expect(result).toHaveLength(60);
      expect(result.endsWith("...")).toBe(true);
    });

    it("handles exact max length", () => {
      const backend = new TestBackend();
      const command = "a".repeat(60);
      const result = backend["formatCommandForDescription"](command, 60);

      expect(result).toBe(command);
      expect(result.endsWith("...")).toBe(false);
    });
  });
});
