import { execSync } from "child_process";
import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "./backend.js";
import type { BackendType, SplitDirection, TargetType } from "../types.js";
import type { Environment } from "../types.js";

export class ZellijBackend extends BaseBackend {
  name: BackendType = "zellij";

  capabilities: BackendCapabilities = {
    pane: true,
    tab: false,
    window: false,
    directions: ["left", "right", "up", "down"],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.inZellij && env.zellijAvailable;
  }

  runPane(command: string, direction: SplitDirection): void {
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

  runTab(command: string): void {
    throw new Error("zellij does not support tab targets. Use pane instead.");
  }

  runWindow(command: string): void {
    throw new Error("zellij does not support window targets. Use pane instead.");
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    if (!direction) {
      direction = "right"; // default
    }

    const zellijDirection = mapSplitDirection(direction);
    const escapedCommand = command
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$")
      .replace(/`/g, "\\`");

    const zellijCommand = `zellij action new-pane --direction "${zellijDirection}" && zellij action write-chars "${escapedCommand}" && zellij action write 13`;
    const formattedCommand = this.formatCommandForDescription(command);

    return {
      command: zellijCommand,
      description: `zellij pane (${direction}): "${formattedCommand}"`,
      requiresPermissions: false,
    };
  }
}

/**
 * Legacy export for backward compatibility
 */
export function runInZellijPane(command: string, direction: SplitDirection): void {
  const backend = new ZellijBackend();
  backend.runPane(command, direction);
}

/**
 * Map our SplitDirection to zellij direction name
 * Zellij supports: Left, Right, Up, Down
 *
 * Note: The --direction flag has a known bug (https://github.com/zellij-org/zellij/issues/3332)
 * where up/down always opens below and left/right always opens after. This is a
 * zellij issue, not an elsewhere bug.
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

