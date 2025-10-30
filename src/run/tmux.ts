import { execSync } from "child_process";
import type { SplitDirection } from "../types.js";

/**
 * Split a tmux pane and run a command in it
 */
export function runInTmuxPane(
  command: string,
  direction: SplitDirection
): void {
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
