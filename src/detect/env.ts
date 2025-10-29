import { execSync } from "child_process";
import type { Environment } from "../types.js";

export function detectEnvironment(): Environment {
  const inTmux = Boolean(process.env.TMUX);
  const inSSH = Boolean(process.env.SSH_TTY ?? process.env.SSH_CONNECTION);
  const isMacOS = process.platform === "darwin";
  const tmuxAvailable = isTmuxAvailable();

  return {
    inTmux,
    inSSH,
    isMacOS,
    terminalAppExists: isMacOS ? isTerminalAppAvailable() : false,
    tmuxAvailable,
  };
}

function isTmuxAvailable(): boolean {
  try {
    execSync("which tmux", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isTerminalAppAvailable(): boolean {
  try {
    execSync(
      'test -d "/Applications/Terminal.app"',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}
