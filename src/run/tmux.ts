import { execSync } from "child_process";
import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "./backend.js";
import type { BackendType, SplitDirection, TargetType } from "../types.js";
import type { Environment } from "../types.js";
import type { Backend } from "./backend.js";
import { ITerm2Backend } from "./macos/iterm2.js";
import { KittyBackend } from "./cli/kitty.js";
import { GhosttyBackend } from "./macos/ghostty.js";
import { WarpBackend } from "./macos/warp.js";
import { TerminalBackend } from "./macos/terminal.js";

export class TmuxBackend extends BaseBackend {
  name: BackendType = "tmux";

  capabilities: BackendCapabilities = {
    pane: true,
    tab: true,
    window: true,
    directions: ["left", "right", "up", "down"],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.inTmux && env.tmuxAvailable;
  }

  runPane(command: string, direction: SplitDirection): void {
    const flags = getSplitFlags(direction);

    try {
      // Split the pane
      execSync(`tmux split-window ${flags}`, { stdio: "inherit" });

      // Send the command and press Enter
      // We need to escape the command properly for send-keys
      const escapedCommand = escapeForSendKeys(command);
      execSync(`tmux send-keys "${escapedCommand}" Enter`, { stdio: "inherit" });
    } catch (error) {
      throw new Error(
        `Failed to run command in tmux pane: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runTab(command: string): void {
    try {
      // Create new tmux window (analogous to a tab)
      execSync("tmux new-window", { stdio: "inherit" });

      // Send the command to the new window
      const escapedCommand = escapeForSendKeys(command);
      execSync(`tmux send-keys "${escapedCommand}" Enter`, { stdio: "inherit" });
    } catch (error) {
      throw new Error(
        `Failed to run command in tmux tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      // Delegate to a GUI terminal window if we can detect one
      const detectedTerminal = this.detectUnderlyingTerminal();
      if (detectedTerminal) {
        // Create a new window in the detected terminal
        this.delegateToTerminal(detectedTerminal, command);
        return;
      }

      // Fallback: create a new tmux window (same as tab behavior)
      this.runTab(command);
    } catch (error) {
      throw new Error(
        `Failed to run command in tmux window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    direction ??= "right"; // default

    const flags = getSplitFlags(direction);
    const escapedCommand = escapeForSendKeys(command);
    const formattedCommand = this.formatCommandForDescription(command);

    switch (target) {
      case "pane": {
        const tmuxCommand = `tmux split-window ${flags} && tmux send-keys "${escapedCommand}" Enter`;
        return {
          command: tmuxCommand,
          description: `tmux pane (${direction}): "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
      case "tab": {
        const tmuxCommand = `tmux new-window && tmux send-keys "${escapedCommand}" Enter`;
        return {
          command: tmuxCommand,
          description: `tmux window: "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
      case "window": {
        // Try to detect the underlying terminal for accurate dry-run info
        const detectedTerminal = this.detectUnderlyingTerminal();
        if (detectedTerminal) {
          return {
            command: `(delegate to ${detectedTerminal})`,
            description: `${detectedTerminal} window: "${formattedCommand}"`,
            requiresPermissions: false,
          };
        }
        // Fallback: show what will happen if delegation fails
        const tmuxCommand = `tmux new-window && tmux send-keys "${escapedCommand}" Enter (fallback)`;
        return {
          command: tmuxCommand,
          description: `new window (delegation failed, using tmux): "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
    }
  }

  private detectUnderlyingTerminal(): string | null {
    // Try to detect the terminal that started the tmux session
    // TERM_PROGRAM reflects the environment when tmux was started
    const termProgram = process.env.TERM_PROGRAM?.toLowerCase();

    // Map to terminal names we support
    if (termProgram?.includes("iterm")) return "iTerm2";
    if (termProgram?.includes("kitty")) return "kitty";
    if (termProgram?.includes("ghostty")) return "Ghostty";
    if (termProgram?.includes("warp")) return "Warp";
    if (termProgram?.includes("apple")) return "terminal";

    // Note: This detection has limitations - it reflects the environment when
    // the tmux session was started, not necessarily the current attaching client's terminal.
    return null;
  }

  private delegateToTerminal(terminalName: string, command: string): void {
    // Map terminal names to backend instances
    const terminalBackends: Record<string, Backend> = {
      "iTerm2": new ITerm2Backend(),
      "kitty": new KittyBackend(),
      "Ghostty": new GhosttyBackend(),
      "Warp": new WarpBackend(),
      "terminal": new TerminalBackend(),
    };

    const backend = terminalBackends[terminalName];
    if (!backend) {
      // Fallback to tmux window if terminal not recognized
      this.runTab(command);
      return;
    }

    try {
      // Delegate to the GUI backend's window creation
      backend.runWindow(command);
    } catch (error) {
      // If delegation fails, fall back to tmux window
      this.runTab(command);
    }
  }
}

/**
 * Legacy export for backward compatibility
 */
export function runInTmuxPane(
  command: string,
  direction: SplitDirection
): void {
  const backend = new TmuxBackend();
  backend.runPane(command, direction);
}

/**
 * Get tmux split-window flags for a given direction
 * -h for horizontal (left/right)
 * -v for vertical (up/down)
 * -b for before (left/up split before current pane)
 */
function getSplitFlags(direction: SplitDirection): string {
  switch (direction) {
    case "left":
      return "-h -b"; // horizontal split, before
    case "right":
      return "-h"; // horizontal split, after
    case "up":
      return "-v -b"; // vertical split, before
    case "down":
      return "-v"; // vertical split, after
  }
}

/**
 * Escape a command string for tmux send-keys
 */
function escapeForSendKeys(command: string): string {
  // Escape double quotes and backslashes for the shell
  return command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
