import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";
import { escapeForAppleScript } from "../../utils/escape.js";

/**
 * Terminal.app backend implementation using AppleScript.
 *
 * Note: Terminal.app does not support tabs via AppleScript. The `do script` command
 * has no native way to create new tabs. It only supports:
 * - `do script "command"` → creates new WINDOW
 * - `do script "command" in window 1` → runs in CURRENT TAB (does not create new tab)
 *
 * Attempting to use "in front window" fails when no window is open, and reuses the
 * current tab when a window exists. Therefore, tab support is not implemented.
 * Users requesting --tab will have it degraded to --window automatically.
 */

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

  runPane(_command: string, _direction: SplitDirection): void {
    throw new Error("Terminal.app does not support pane targets. Use --window instead.");
  }

  runTab(_command: string): void {
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

  getDryRunInfo(target: TargetType, command: string, _direction?: SplitDirection): DryRunInfo {
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `tell application "Terminal"\n  activate\n  do script "${escapedCommand}"\nend tell`;
    const formattedCommand = this.formatCommandForDescription(command);

    return {
      command: `osascript -e '${appleScript.replace(/'/g, "'\\''")}'`,
      description: `Terminal.app ${target === "pane" ? "window (panes unsupported)" : "window"}: "${formattedCommand}"`,
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
