import { execSync } from "child_process";
import type { Environment } from "../types.js";
import { detectCurrentTerminal } from "./terminal.js";

export function detectEnvironment(): Environment {
  const inTmux = Boolean(process.env.TMUX);
  const inSSH = Boolean(process.env.SSH_TTY ?? process.env.SSH_CONNECTION);
  const isMacOS = process.platform === "darwin";
  const tmuxAvailable = isTmuxAvailable();
  const inZellij = Boolean(process.env.ZELLIJ);
  const zellijAvailable = isZellijAvailable();

  // Detect all new backends
  const inITerm2 = Boolean(process.env.ITERM_SESSION_ID);
  const iTerm2Available = isMacOS ? isITerm2Available() : false;
  const inKitty = Boolean(process.env.KITTY_WINDOW_ID);
  const kittyAvailable = isKittyAvailable();
  const inGhostty = Boolean(process.env.GHOSTTY_RESOURCES_DIR);
  const ghosttyAvailable = isMacOS ? isGhosttyAvailable() : false;
  const inWarp = Boolean(process.env.WARP_SPAWN); // Warp sets this env var
  const warpAvailable = isMacOS ? isWarpAvailable() : false;

  // Detect VSCode/Cursor (special handling - treated as unsupported terminals)
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || "";
  const inVSCode = termProgram === "vscode";
  const inCursor = termProgram === "cursor";

  // Detect current terminal emulator
  const currentTerminal = detectCurrentTerminal();

  return {
    inTmux,
    inSSH,
    isMacOS,
    terminalAppExists: isMacOS ? isTerminalAppAvailable() : false,
    tmuxAvailable,
    inZellij,
    zellijAvailable,
    inITerm2,
    iTerm2Available,
    inKitty,
    kittyAvailable,
    inGhostty,
    ghosttyAvailable,
    inWarp,
    warpAvailable,
    inVSCode,
    inCursor,
    currentTerminal,
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

function isITerm2Available(): boolean {
  try {
    execSync(
      'osascript -e \'POSIX path of (path to application "iTerm")\'',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function isKittyAvailable(): boolean {
  try {
    execSync("which kitty", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isGhosttyAvailable(): boolean {
  try {
    execSync(
      'osascript -e \'POSIX path of (path to application "Ghostty")\'',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function isWarpAvailable(): boolean {
  try {
    execSync(
      'osascript -e \'POSIX path of (path to application "Warp")\'',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}
