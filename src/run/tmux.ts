import { execSync } from "child_process";
import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "./backend.js";
import type { BackendType, SplitDirection, TargetType } from "../types.js";
import type { Environment } from "../types.js";

export class TmuxBackend extends BaseBackend {
  name: BackendType = "tmux";

  capabilities: BackendCapabilities = {
    pane: true,
    tab: false,
    window: false,
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
    throw new Error("tmux does not support tab targets. Use pane instead.");
  }

  runWindow(command: string): void {
    throw new Error("tmux does not support window targets. Use pane instead.");
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    if (!direction) {
      direction = "right"; // default
    }

    const flags = getSplitFlags(direction);
    const escapedCommand = escapeForSendKeys(command);
    const tmuxCommand = `tmux split-window ${flags} && tmux send-keys "${escapedCommand}" Enter`;
    const formattedCommand = this.formatCommandForDescription(command);

    return {
      command: tmuxCommand,
      description: `tmux pane (${direction}): "${formattedCommand}"`,
      requiresPermissions: false,
    };
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
