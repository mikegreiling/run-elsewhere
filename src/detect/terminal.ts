import { execSync } from "child_process";

export type SupportedTerminal =
  | "Terminal"
  | "iTerm2"
  | "kitty"
  | "Ghostty"
  | "Warp"
  | "VSCode"
  | "Cursor"
  | "unknown";

/**
 * Detects the current terminal emulator running the shell.
 * Uses multiple detection methods in priority order:
 * 1. $TERM_PROGRAM environment variable (most reliable)
 * 2. $LC_TERMINAL environment variable (some terminals set this)
 * 3. Parent process inspection (fallback)
 */
export function detectCurrentTerminal(): SupportedTerminal {
  // Method 1: Check $TERM_PROGRAM (most reliable)
  const termProgram = process.env.TERM_PROGRAM;
  if (termProgram) {
    return mapTermProgram(termProgram);
  }

  // Method 2: Check $LC_TERMINAL
  const lcTerminal = process.env.LC_TERMINAL;
  if (lcTerminal) {
    return mapTerminal(lcTerminal);
  }

  // Method 3: Inspect parent process
  try {
    const parentProcess = getParentProcessName();
    if (parentProcess) {
      return mapTerminal(parentProcess);
    }
  } catch {
    // Continue to unknown
  }

  return "unknown";
}

/**
 * Maps $TERM_PROGRAM values to standard terminal names.
 * This env var is set by most modern terminal emulators.
 */
function mapTermProgram(termProgram: string): SupportedTerminal {
  switch (termProgram.toLowerCase()) {
    case "iterm.app":
      return "iTerm2";
    case "apple_terminal":
      return "Terminal";
    case "vscode":
      return "VSCode";
    case "cursor":
      return "Cursor";
    case "kitty":
      return "kitty";
    case "ghostty":
      return "Ghostty";
    case "warp":
      return "Warp";
    default:
      return "unknown";
  }
}

/**
 * Maps various terminal names (from LC_TERMINAL, process names, etc.)
 * to standard terminal names.
 */
function mapTerminal(terminal: string): SupportedTerminal {
  const normalized = terminal.toLowerCase();

  if (
    normalized.includes("iterm") ||
    normalized.includes("iterm2") ||
    normalized.includes("iterm.app")
  ) {
    return "iTerm2";
  }
  if (
    normalized.includes("terminal") &&
    !normalized.includes("vscode") &&
    !normalized.includes("cursor")
  ) {
    return "Terminal";
  }
  if (normalized.includes("kitty")) {
    return "kitty";
  }
  if (normalized.includes("ghostty")) {
    return "Ghostty";
  }
  if (normalized.includes("warp")) {
    return "Warp";
  }
  if (normalized.includes("vscode")) {
    return "VSCode";
  }
  if (normalized.includes("cursor")) {
    return "Cursor";
  }

  return "unknown";
}

/**
 * Gets the parent process name by inspecting the process tree.
 * Uses `ps -p $PPID -o comm=` to get the parent process executable name.
 */
function getParentProcessName(): string | null {
  try {
    const ppid = process.ppid;
    if (!ppid) return null;

    const result = execSync(`ps -p ${String(ppid)} -o comm=`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return result || null;
  } catch {
    return null;
  }
}

/**
 * Checks if a terminal is unsupported (VSCode, Cursor, or unknown).
 * These terminals don't have direct automation APIs.
 */
export function isUnsupportedTerminal(terminal: SupportedTerminal): boolean {
  return terminal === "VSCode" || terminal === "Cursor" || terminal === "unknown";
}

/**
 * Checks if a terminal is experimental (requires System Events/Accessibility).
 */
export function isExperimentalTerminal(terminal: SupportedTerminal): boolean {
  return terminal === "Ghostty" || terminal === "Warp";
}
