import { execSync } from "child_process";
import type { SplitDirection } from "../types.js";

/**
 * Split a tmux pane and run a command in it
 */
export function runInTmuxPane(
  command: string,
  direction: SplitDirection
): void {
  const splitFlag = direction === "h" ? "-h" : "-v";

  try {
    // Split the pane
    execSync(`tmux split-window ${splitFlag}`, { stdio: "inherit" });

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
 * Escape a command string for tmux send-keys
 */
function escapeForSendKeys(command: string): string {
  // Escape double quotes and backslashes for the shell
  return command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
