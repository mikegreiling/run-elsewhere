import { describe, it, expect } from "vitest";
import {
  resolveTargetType,
  canAchieveTargetWithoutDegradation,
} from "../../src/planner/targets.js";
import type { Options } from "../../src/types.js";
import type { Backend, BackendCapabilities } from "../../src/run/backend.js";
import type { Environment } from "../../src/types.js";

// Mock backend for testing
class MockBackend implements Backend {
  name = "test" as any;
  capabilities: BackendCapabilities;

  constructor(capabilities: BackendCapabilities) {
    this.capabilities = capabilities;
  }

  isAvailable(_env: Environment): boolean {
    return true;
  }

  runPane(_command: string, _direction: any): void {
    throw new Error("Not implemented");
  }

  runTab(_command: string): void {
    throw new Error("Not implemented");
  }

  runWindow(_command: string): void {
    throw new Error("Not implemented");
  }

  getDryRunInfo(_target: any, _command: string, _direction?: any): any {
    return { command: "test", description: "test", requiresPermissions: false };
  }
}

describe("resolveTargetType", () => {
  describe("explicit target selection", () => {
    it("returns pane when --pane specified and backend supports it", () => {
      const options: Options = { pane: true };
      const backend = new MockBackend({
        pane: true,
        tab: true,
        window: true,
        directions: ["left", "right", "up", "down"],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("pane");
      expect(result.requestedTarget).toBe("pane");
      expect(result.degraded).toBe(false);
    });

    it("returns tab when --tab specified and backend supports it", () => {
      const options: Options = { tab: true };
      const backend = new MockBackend({
        pane: false,
        tab: true,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("tab");
      expect(result.requestedTarget).toBe("tab");
      expect(result.degraded).toBe(false);
    });

    it("returns window when --window specified", () => {
      const options: Options = { window: true };
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("window");
      expect(result.requestedTarget).toBe("window");
      expect(result.degraded).toBe(false);
    });
  });

  describe("smart defaults", () => {
    it("defaults to pane for multiplexer backends", () => {
      const options: Options = {};
      const backend = new MockBackend({
        pane: true,
        tab: false,
        window: false,
        directions: ["left", "right", "up", "down"],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("pane");
      expect(result.requestedTarget).toBeUndefined();
      expect(result.degraded).toBe(false);
    });

    it("defaults to window for GUI terminal backends", () => {
      const options: Options = {};
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("window");
      expect(result.requestedTarget).toBeUndefined();
      expect(result.degraded).toBe(false);
    });

    it("defaults to tab when window not available", () => {
      const options: Options = {};
      const backend = new MockBackend({
        pane: false,
        tab: true,
        window: false,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("tab");
    });
  });

  describe("degradation rules", () => {
    it("degrades pane to tab when pane unsupported", () => {
      const options: Options = { pane: true };
      const backend = new MockBackend({
        pane: false,
        tab: true,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("tab");
      expect(result.requestedTarget).toBe("pane");
      expect(result.degraded).toBe(true);
      expect(result.degradationWarning).toContain("does not support panes");
    });

    it("degrades pane to window when pane and tab unsupported", () => {
      const options: Options = { pane: true };
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("window");
      expect(result.requestedTarget).toBe("pane");
      expect(result.degraded).toBe(true);
      expect(result.degradationWarning).toContain("does not support panes or tabs");
    });

    it("degrades tab to window when tab unsupported", () => {
      const options: Options = { tab: true };
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: true,
        directions: [],
        experimental: false,
      });

      const result = resolveTargetType(options, backend);

      expect(result.target).toBe("window");
      expect(result.requestedTarget).toBe("tab");
      expect(result.degraded).toBe(true);
      expect(result.degradationWarning).toContain("does not support tabs");
    });
  });

  describe("strict mode (--no flag)", () => {
    it("throws error when pane requested but unsupported in strict mode", () => {
      const options: Options = { pane: true, no: true };
      const backend = new MockBackend({
        pane: false,
        tab: true,
        window: true,
        directions: [],
        experimental: false,
      });

      expect(() => resolveTargetType(options, backend)).toThrow(
        "does not support pane targets"
      );
    });

    it("throws error when tab requested but unsupported in strict mode", () => {
      const options: Options = { tab: true, no: true };
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: true,
        directions: [],
        experimental: false,
      });

      expect(() => resolveTargetType(options, backend)).toThrow(
        "does not support tab targets"
      );
    });
  });

  describe("error cases", () => {
    it("throws error when window requested but unsupported", () => {
      const options: Options = { window: true };
      const backend = new MockBackend({
        pane: true,
        tab: false,
        window: false,
        directions: [],
        experimental: false,
      });

      expect(() => resolveTargetType(options, backend)).toThrow(
        "does not support window targets"
      );
    });

    it("throws error when backend supports nothing", () => {
      const options: Options = { pane: true };
      const backend = new MockBackend({
        pane: false,
        tab: false,
        window: false,
        directions: [],
        experimental: false,
      });

      expect(() => resolveTargetType(options, backend)).toThrow();
    });
  });
});

describe("canAchieveTargetWithoutDegradation", () => {
  it("returns true when backend supports pane", () => {
    const backend = new MockBackend({
      pane: true,
      tab: false,
      window: false,
      directions: [],
      experimental: false,
    });

    expect(canAchieveTargetWithoutDegradation("pane", backend)).toBe(true);
  });

  it("returns false when backend does not support pane", () => {
    const backend = new MockBackend({
      pane: false,
      tab: true,
      window: true,
      directions: [],
      experimental: false,
    });

    expect(canAchieveTargetWithoutDegradation("pane", backend)).toBe(false);
  });

  it("returns true when backend supports tab", () => {
    const backend = new MockBackend({
      pane: false,
      tab: true,
      window: true,
      directions: [],
      experimental: false,
    });

    expect(canAchieveTargetWithoutDegradation("tab", backend)).toBe(true);
  });

  it("returns true when backend supports window", () => {
    const backend = new MockBackend({
      pane: false,
      tab: false,
      window: true,
      directions: [],
      experimental: false,
    });

    expect(canAchieveTargetWithoutDegradation("window", backend)).toBe(true);
  });
});
