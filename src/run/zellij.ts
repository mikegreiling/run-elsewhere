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

export class ZellijBackend extends BaseBackend {
  name: BackendType = "zellij";

  capabilities: BackendCapabilities = {
    pane: true,
    tab: true,
    window: true,
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
    try {
      // Escape command for use in double quotes
      const escapedCommand = command
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\$/g, "\\$")
        .replace(/`/g, "\\`");

      // Create new tab (zellij's equivalent of tmux window)
      execSync("zellij action new-tab", { stdio: "inherit" });

      // Write command to the focused tab
      execSync(`zellij action write-chars "${escapedCommand}"`, {
        stdio: "inherit",
      });

      // Send Enter key (ASCII 13) to execute the command
      execSync("zellij action write 13", { stdio: "inherit" });
    } catch (error) {
      throw new Error(
        `Failed to run command in zellij tab: ${error instanceof Error ? error.message : String(error)}`
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

      // Fallback: create a new zellij tab (same as tab behavior)
      this.runTab(command);
    } catch (error) {
      throw new Error(
        `Failed to run command in zellij window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    direction ??= "right"; // default

    const escapedCommand = command
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$")
      .replace(/`/g, "\\`");

    const formattedCommand = this.formatCommandForDescription(command);

    switch (target) {
      case "pane": {
        const zellijDirection = mapSplitDirection(direction);
        const zellijCommand = `zellij action new-pane --direction "${zellijDirection}" && zellij action write-chars "${escapedCommand}" && zellij action write 13`;
        return {
          command: zellijCommand,
          description: `zellij pane (${direction}): "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
      case "tab": {
        const zellijCommand = `zellij action new-tab && zellij action write-chars "${escapedCommand}" && zellij action write 13`;
        return {
          command: zellijCommand,
          description: `zellij tab: "${formattedCommand}"`,
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
        const zellijCommand = `zellij action new-tab && zellij action write-chars "${escapedCommand}" && zellij action write 13 (fallback)`;
        return {
          command: zellijCommand,
          description: `new window (delegation failed, using zellij): "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
    }
  }

  private detectUnderlyingTerminal(): string | null {
    // Try to detect the terminal that started the zellij session
    // TERM_PROGRAM reflects the environment when zellij was started
    const termProgram = process.env.TERM_PROGRAM?.toLowerCase();

    // Map to terminal names we support
    if (termProgram?.includes("iterm")) return "iTerm2";
    if (termProgram?.includes("kitty")) return "kitty";
    if (termProgram?.includes("ghostty")) return "Ghostty";
    if (termProgram?.includes("warp")) return "Warp";
    if (termProgram?.includes("apple")) return "terminal";

    // Note: This detection has limitations - it reflects the environment when
    // the zellij session was started, not necessarily the current attaching client's terminal.
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
      // Fallback to zellij tab if terminal not recognized
      this.runTab(command);
      return;
    }

    try {
      // Delegate to the GUI backend's window creation
      backend.runWindow(command);
    } catch (error) {
      // If delegation fails, fall back to zellij tab
      this.runTab(command);
    }
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

