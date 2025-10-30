import { execSync } from "child_process";
import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";

export class KittyBackend extends BaseBackend {
  name: BackendType = "kitty";

  capabilities: BackendCapabilities = {
    pane: false, // kitty doesn't have a pane concept like tmux
    tab: true,
    window: true,
    directions: [],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.kittyAvailable;
  }

  runPane(command: string, direction: SplitDirection): void {
    throw new Error(
      "kitty does not support pane targets. Please use --tab or --window instead."
    );
  }

  runTab(command: string): void {
    try {
      const shellCommand = this.buildKittyCommand("tab", command);
      execSync(shellCommand, { stdio: "inherit" });
    } catch (error) {
      throw new Error(
        `Failed to run command in kitty tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      const shellCommand = this.buildKittyCommand("os-window", command);
      execSync(shellCommand, { stdio: "inherit" });
    } catch (error) {
      throw new Error(
        `Failed to run command in kitty window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    const targetType = target === "pane" ? "tab" : target;
    const kittyType = targetType === "tab" ? "tab" : "os-window";
    const shellCommand = this.buildKittyCommand(kittyType, command);
    const formattedCommand = this.formatCommandForDescription(command);

    return {
      command: shellCommand,
      description: `kitty ${targetType}: "${formattedCommand}"`,
      requiresPermissions: false,
    };
  }

  private buildKittyCommand(type: "tab" | "os-window", command: string): string {
    // Use $SHELL -c to execute the command, then exec $SHELL to get an interactive shell after
    // This gives the user an interactive shell after the command completes
    const escapedCommand = escapeForShell(command);
    return `kitty @ launch --type=${type} --title "Elsewhere" -- $SHELL -c "${escapedCommand}; exec $SHELL"`;
  }
}

/**
 * Escape a string for use in shell double quotes.
 * Within double quotes, we need to escape: $, `, \, and "
 */
function escapeForShell(str: string): string {
  return str
    .replace(/\\/g, "\\\\") // backslash
    .replace(/"/g, '\\"') // double quote
    .replace(/\$/g, "\\$") // dollar sign
    .replace(/`/g, "\\`"); // backtick
}
