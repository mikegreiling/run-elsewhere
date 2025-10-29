import { describe, it, expect } from "vitest";
import { resolveCommand } from "../../src/command.js";

describe("resolveCommand", () => {
  it("returns -c flag value when provided", () => {
    const result = resolveCommand("echo hi", ["arg1"], false);
    expect(result).toBe("echo hi");
  });

  it("returns args after -- when -c is not provided", () => {
    const result = resolveCommand(undefined, ["echo", "hello"], false);
    expect(result).toBe("echo hello");
  });

  it("returns undefined when no command is provided", () => {
    const result = resolveCommand(undefined, [], false);
    expect(result).toBeUndefined();
  });

  it("prioritizes -c over -- args", () => {
    const result = resolveCommand("echo c-flag", ["echo", "dash-args"], false);
    expect(result).toBe("echo c-flag");
  });

  it("prioritizes -c over stdin", () => {
    const result = resolveCommand("echo c-flag", [], true);
    expect(result).toBe("echo c-flag");
  });

  it("prioritizes -- args over stdin", () => {
    const result = resolveCommand(undefined, ["echo", "dash-args"], true);
    expect(result).toBe("echo dash-args");
  });
});
