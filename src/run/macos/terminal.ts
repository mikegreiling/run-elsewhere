import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";
import { escapeForAppleScript } from "../../utils/escape.js";

export class TerminalBackend extends BaseBackend {
  name: BackendType = "terminal";

  capabilities: BackendCapabilities = {
    pane: false,
    tab: false,
    window: true,
    directions: [],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.isMacOS && env.terminalAppExists;
  }

  runPane(command: string, direction: SplitDirection): void {
    throw new Error("Terminal.app does not support pane targets. Use --window instead.");
  }

  runTab(command: string): void {
    throw new Error("Terminal.app does not support tab targets. Use --window instead.");
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

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    const targetType = target === "pane" ? "window (panes unsupported)" : target;
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}"\nend tell`;
    const formattedCommand = this.formatCommandForDescription(command);

    return {
      command: `osascript -e '${appleScript.replace(/'/g, "'\\''")}'`,
      description: `Terminal.app ${targetType}: "${formattedCommand}"`,
      requiresPermissions: false,
    };
  }
}

/**
 * Legacy export for backward compatibility
 */
export function runInTerminalApp(command: string): void {
  const backend = new TerminalBackend();
  backend.runWindow(command);
}
