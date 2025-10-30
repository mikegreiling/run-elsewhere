import { execSync } from "child_process";
import type { SplitDirection } from "../types.js";

/**
 * Run a command in a new zellij pane
 *
 * Uses zellij's write-chars action to type the command into the pane, similar
 * to tmux's send-keys. This makes the command visible in the pane and adds it
 * to shell history.
 *
 * Note: The --direction flag has a known bug (https://github.com/zellij-org/zellij/issues/3332)
 * where up/down always opens below and left/right always opens after. This is a
 * zellij issue, not an elsewhere bug.
 */
export function runInZellijPane(command: string, direction: SplitDirection): void {
  try {
    const zellijDirection = mapSplitDirection(direction);

    // Escape command for use in double quotes (for write-chars argument)
    const escapedCommand = command
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$")
      .replace(/`/g, "\\`");

    // Step 1: Create new pane (automatically receives focus)
    execSync(`zellij action new-pane --direction "${zellijDirection}"`, {
      stdio: "inherit",
    });

    // Step 2: Write command text to the focused pane
    execSync(`zellij action write-chars "${escapedCommand}"`, {
      stdio: "inherit",
    });

    // Step 3: Send Enter key (ASCII 13) to execute the command
    execSync(`zellij action write 13`, {
      stdio: "inherit",
    });

    // Focus remains on the new pane (matching tmux behavior)
  } catch (error) {
    throw new Error(
      `Failed to run command in zellij pane: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Map our SplitDirection to zellij direction name
 * Zellij supports: Left, Right, Up, Down
 */
function mapSplitDirection(direction: SplitDirection): string {
  switch (direction) {
    case "left":
      return "Left";
    case "right":
      return "Right";
    case "up":
      return "Up";
    case "down":
      return "Down";
  }
}

