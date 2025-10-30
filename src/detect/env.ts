import { execSync } from "child_process";
import type { Environment } from "../types.js";

export function detectEnvironment(): Environment {
  const inTmux = Boolean(process.env.TMUX);
  const inSSH = Boolean(process.env.SSH_TTY ?? process.env.SSH_CONNECTION);
  const isMacOS = process.platform === "darwin";
  const tmuxAvailable = isTmuxAvailable();
  const inZellij = Boolean(process.env.ZELLIJ);
  const zellijAvailable = isZellijAvailable();

  return {
    inTmux,
    inSSH,
    isMacOS,
    terminalAppExists: isMacOS ? isTerminalAppAvailable() : false,
    tmuxAvailable,
    inZellij,
    zellijAvailable,
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
      'osascript -e \'POSIX path of (path to application "Terminal")\'',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function isZellijAvailable(): boolean {
  try {
    execSync("which zellij", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
