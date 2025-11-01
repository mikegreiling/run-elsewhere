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
  inZellij: false,
  zellijAvailable: true,
  // Additional backend fields
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

describe("createPlan", () => {
  it("returns error when no command is provided", () => {
    const options: Options = {};
    const plan = createPlan(undefined, options, mockEnv);
    expect(plan.type).toBe("error");
    expect(plan.exitCode).toBe(EXIT_CODES.USAGE_ERROR);
  });

  it("degrades --tab to window when using Terminal.app", () => {
    // --tab is supported, but Terminal.app only supports windows
    // Target degrades: tab → window
    const options: Options = { tab: true };
    const plan = createPlan("echo hi", options, mockEnv);
    expect(plan.type).toBe("terminal");
    expect(plan.command).toBe("echo hi");
    expect(plan.targetRequested).toBe("tab");
    expect(plan.target).toBe("window");
    expect(plan.targetDegraded).toBe(true);
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

  it("returns zellij plan when forced with --terminal=zellij", () => {
    const options: Options = { terminal: "zellij" };
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.command).toBe("echo hi");
  });

  it("returns error when --terminal=zellij but not in zellij", () => {
    const options: Options = { terminal: "zellij" };
    const env: Environment = { ...mockEnv, inZellij: false };
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

  it("returns error 73 when SSH detected without multiplexer", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inSSH: true,
      inTmux: false,
      inZellij: false,
    };
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

  it("returns zellij plan when SSH detected but inside zellij", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inSSH: true,
      inTmux: false,
      inZellij: true,
      zellijAvailable: true,
    };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
  });

  it("prefers tmux over zellij when SSH with both multiplexers", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inSSH: true,
      inTmux: true,
      inZellij: true,
    };
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

  it("returns zellij plan in auto path when inside zellij", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inTmux: false,
      inZellij: true,
      zellijAvailable: true,
    };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
  });

  it("returns terminal plan when zellij unavailable but Terminal available", () => {
    const options: Options = {};
    const env: Environment = {
      ...mockEnv,
      inTmux: false,
      inZellij: true,
      zellijAvailable: false,
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

  it("splits left", () => {
    const options: Options = { left: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("left");
  });

  it("splits right", () => {
    const options: Options = { right: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("right");
  });

  it("splits up", () => {
    const options: Options = { up: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("up");
  });

  it("splits down", () => {
    const options: Options = { down: true };
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("down");
  });

  it("defaults to right split", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inTmux: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("tmux");
    expect(plan.direction).toBe("right");
  });

  it("zellij plan splits left", () => {
    const options: Options = { left: true };
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.direction).toBe("left");
  });

  it("zellij plan splits right", () => {
    const options: Options = { right: true };
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.direction).toBe("right");
  });

  it("zellij plan splits up", () => {
    const options: Options = { up: true };
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.direction).toBe("up");
  });

  it("zellij plan splits down", () => {
    const options: Options = { down: true };
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.direction).toBe("down");
  });

  it("zellij plan defaults to right split", () => {
    const options: Options = {};
    const env: Environment = { ...mockEnv, inZellij: true };
    const plan = createPlan("echo hi", options, env);
    expect(plan.type).toBe("zellij");
    expect(plan.direction).toBe("right");
  });
});
