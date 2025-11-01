import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";
import { escapeForAppleScript } from "../../utils/escape.js";

export class TerminalBackend extends BaseBackend {
  name: BackendType = "terminal";

  capabilities: BackendCapabilities = {
    pane: false,
    tab: true,
    window: true,
    directions: [],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.isMacOS && env.terminalAppExists;
  }

  runPane(_command: string, _direction: SplitDirection): void {
    throw new Error("Terminal.app does not support pane targets. Use --window instead.");
  }

  runTab(command: string): void {
    try {
      const escapedCommand = escapeForAppleScript(command);
      // Create a tab in the frontmost Terminal window using do script
      // The "in front window" clause automatically creates a tab in an existing window
      const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}" in front window\nend tell`;

      executeAppleScript(appleScript);
    } catch (error) {
      throw new Error(
        `Failed to run command in Terminal.app tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      const escapedCommand = escapeForAppleScript(command);
      const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}"\nend tell`;

      executeAppleScript(appleScript);
    } catch (error) {
      throw new Error(
        `Failed to run command in Terminal.app: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, _direction?: SplitDirection): DryRunInfo {
    const formattedCommand = this.formatCommandForDescription(command);

    switch (target) {
      case "tab": {
        const escapedCommand = escapeForAppleScript(command);
        const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}" in front window\nend tell`;
        return {
          command: `osascript -e '${appleScript.replace(/'/g, "'\\''")}'`,
          description: `Terminal.app tab: "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
      case "window": {
        const escapedCommand = escapeForAppleScript(command);
        const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}"\nend tell`;
        return {
          command: `osascript -e '${appleScript.replace(/'/g, "'\\''")}'`,
          description: `Terminal.app window: "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
      case "pane": {
        return {
          command: "N/A (panes unsupported)",
          description: `Terminal.app window (panes unsupported): "${formattedCommand}"`,
          requiresPermissions: false,
        };
      }
    }
  }
}

/**
 * Legacy export for backward compatibility
 */
export function runInTerminalApp(command: string): void {
  const backend = new TerminalBackend();
  backend.runWindow(command);
}
