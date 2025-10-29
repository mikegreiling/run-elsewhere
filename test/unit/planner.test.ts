import { describe, it, expect } from "vitest";
import { createPlan } from "../../src/planner.js";
import { EXIT_CODES } from "../../src/constants.js";
import type { Environment, Options } from "../../src/types.js";

const mockEnv: Environment = {
  inTmux: false,
  inSSH: false,
  isMacOS: true,
  terminalAppExists: true,
  tmuxAvailable: true,
};

describe("createPlan", () => {
  it("returns error when no command is provided", () => {
    const options: Options = {};
    const plan = createPlan(undefined, options, mockEnv);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.USAGE_ERROR);
  });

  it("returns error for --tab option (not supported in Phase 1)", () => {
    const options: Options = { tab: true };
    const plan = createPlan("echo hi", options, mockEnv);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.USAGE_ERROR);
  });

  it("returns tmux plan when forced with --terminal=tmux", () => {
    const options: Options = { terminal: "tmux" };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.command).toBe("echo hi");
  });

  it("returns error when --terminal=tmux but not in tmux", () => {
    const options: Options = { terminal: "tmux" };
    const env: Environment = { ...mockEnv, inTmux: false };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.SOFTWARE_ERROR);
  });

  it("returns terminal plan when forced with --terminal=Terminal", () => {
    const options: Options = { terminal: "Terminal" };
    const plan = createPlan("echo hi", options, mockEnv);
    expect(plan.type).toBe("terminal");
    expect(plan.command).toBe("echo hi");
  });

  it("returns error when --terminal=Terminal but Terminal.app not available", () => {
    const options: Options = { terminal: "Terminal" };
    const env: Environment = { ...mockEnv, terminalAppExists: false };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.SOFTWARE_ERROR);
  });

  it("returns error for invalid --terminal option", () => {
    const options: Options = { terminal: "invalid" as "tmux" | "Terminal" };
    const plan = createPlan("echo hi", options, mockEnv);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.USAGE_ERROR);
  });

  it("returns error 73 when SSH detected without tmux", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inSSH: true, inTmux: false };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.SSH_GUI_INFEASIBLE);
  });

  it("returns tmux plan when SSH detected but inside tmux", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inSSH: true, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
  });

  it("returns tmux plan in auto path when inside tmux", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
  });

  it("returns terminal plan in auto path when not tmux but Terminal available", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inTmux: false,
      isMacOS: true,
      terminalAppExists: true,
    };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("terminal");
  });

  it("returns error 75 when no viable backend", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inTmux: false,
      isMacOS: false,
      terminalAppExists: false,
    };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.NO_VIABLE_BACKEND);
  });

  it("uses horizontal split (-h) for left/right", () => {
    const options: Options = { left: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("h");
  });

  it("uses vertical split (-v) for up/down", () => {
    const options: Options = { up: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("v");
  });

  it("defaults to horizontal split", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("h");
  });
});
