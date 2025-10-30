import { execSync } from "child_process";
import type { SplitDirection } from "../types.js";

/**
 * Run a command in a new zellij pane
 */
export function runInZellijPane(command: string, direction: SplitDirection): void {
  try {
    const zellijDirection = mapSplitDirection(direction);
    const escapedCommand = escapeForShell(command);

    const zellijCommand = `zellij action new-pane --direction "${zellijDirection}" -- ${escapedCommand}`;

    execSync(zellijCommand, {
      stdio: "inherit",
    });
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

/**
 * Escape a command for shell execution
 */
function escapeForShell(command: string): string {
  // Escape single quotes by replacing ' with '"'"'
  // This handles the shell escaping for commands with quotes
  return `'${command.replace(/'/g, "'\\''")}'`;
}
