import { execSync } from "child_process";

/**
 * Walk up the parent process tree from a given PID to find a GUI terminal emulator.
 * Returns the detected terminal name (e.g., "Ghostty", "kitty", "iTerm2") or null.
 * If verbose is true, logs each step of the process tree traversal.
 */
export function walkProcessTree(startPid: number, verbose = false): string | null {
  const maxIterations = 64;
  let pid = startPid;
  let iterations = 0;

  if (verbose) {
    console.error(`[DEBUG] Process tree detection starting from PID: ${String(startPid)}`);
  }

  while (pid > 1 && iterations < maxIterations) {
    try {
      // Get process name for current PID
      const comm = execSync(`ps -o comm= -p ${String(pid)}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
        .trim()
        .toLowerCase();

      // Check for known terminal emulators
      const detectedTerminal = matchTerminalEmulator(comm);
      if (verbose) {
        console.error(
          `[DEBUG] PID ${String(pid)}: comm="${comm}" - ${detectedTerminal ? `MATCHED: ${detectedTerminal}` : "no match"}`
        );
      }
      if (detectedTerminal) {
        if (verbose) {
          console.error(`[DEBUG] Terminal detected: ${detectedTerminal}`);
        }
        return detectedTerminal;
      }

      // If we hit sshd, stop - indicates headless/SSH session
      if (comm.includes("sshd")) {
        if (verbose) {
          console.error(`[DEBUG] Hit sshd - stopping (SSH session detected)`);
        }
        return null;
      }

      // Get parent PID
      const ppidStr = execSync(`ps -o ppid= -p ${String(pid)}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      const ppid = parseInt(ppidStr, 10);
      if (verbose) {
        console.error(`[DEBUG]   -> parent PID: ${String(ppid)}`);
      }
      if (isNaN(ppid) || ppid === pid || ppid === 1) {
        // Reached root or invalid parent
        if (verbose) {
          console.error(`[DEBUG] Reached root or invalid parent, stopping`);
        }
        break;
      }

      pid = ppid;
      iterations++;
    } catch {
      // If any ps command fails, stop walking
      if (verbose) {
        console.error(`[DEBUG] ps command failed for PID ${String(pid)}, stopping`);
      }
      break;
    }
  }

  if (verbose) {
    console.error(`[DEBUG] Process tree search complete - no terminal detected`);
  }
  return null;
}

/**
 * Match process name against known GUI terminal emulators.
 */
function matchTerminalEmulator(processName: string): string | null {
  // macOS terminals
  if (processName.includes("iterm2") || processName.includes("iterm")) {
    return "iTerm2";
  }
  if (
    processName.includes("terminal.app") ||
    processName === "terminal" ||
    processName.includes("terminal")
  ) {
    return "terminal";
  }
  if (processName.includes("ghostty")) {
    return "Ghostty";
  }
  if (processName.includes("warp")) {
    return "Warp";
  }

  // Cross-platform terminals
  if (processName.includes("kitty")) {
    return "kitty";
  }
  if (processName.includes("alacritty")) {
    return "Alacritty";
  }
  if (processName.includes("wezterm")) {
    return "WezTerm";
  }

  return null;
}
