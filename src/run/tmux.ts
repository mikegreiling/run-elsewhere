import { execSync } from "child_process";
import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "./backend.js";
import type { BackendType, SplitDirection, TargetType } from "../types.js";
import type { Environment } from "../types.js";

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
        const tmuxCommand = `tmux new-window && tmux send-keys "${escapedCommand}" Enter (or delegate to terminal)`;
        return {
          command: tmuxCommand,
          description: `new terminal window: "${formattedCommand}"`,
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

  private delegateToTerminal(_terminalName: string, _command: string): void {
    // This is a fallback mechanism. In practice, delegating to another backend
    // from within tmux is complex because we'd need to exec out of tmux context.
    // For now, we fall back to tab behavior (creating a tmux window).
    // A more sophisticated implementation could use tmux's socket to communicate
    // with the terminal process, but that's beyond the current scope.
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
