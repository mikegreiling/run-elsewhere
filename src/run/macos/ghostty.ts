import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";
import { escapeForAppleScript } from "../../utils/escape.js";
import { isAppRunning } from "../../utils/app-running.js";

/**
 * Ghostty backend implementation using System Events automation.
 *
 * Note: Ghostty currently lacks public scripting/automation APIs. This implementation
 * uses macOS System Events to send keystrokes, which requires Accessibility permissions.
 * This is a workaround until Ghostty provides official scriptability support.
 *
 * See: https://github.com/ghostty-org/ghostty/discussions/2353
 */
export class GhosttyBackend extends BaseBackend {
  name: BackendType = "Ghostty";

  capabilities: BackendCapabilities = {
    pane: false,
    tab: true,
    window: true,
    directions: [],
    experimental: true,
  };

  isAvailable(env: Environment): boolean {
    return env.isMacOS && env.ghosttyAvailable;
  }

  runPane(_command: string, _direction: SplitDirection): void {
    throw new Error(
      "Ghostty does not support pane targets. Please use --tab or --window instead."
    );
  }

  runTab(command: string): void {
    try {
      const running = isAppRunning("Ghostty");
      if (running) {
        this.createTabViaSystemEvents(command);
      } else {
        // App not running, launch it and use the window that opens
        this.launchAndRun(command);
      }
    } catch (error) {
      throw new Error(
        `Failed to run command in Ghostty tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      const running = isAppRunning("Ghostty");
      if (running) {
        this.createWindowViaSystemEvents(command);
      } else {
        // App not running, launch it and use the window that opens
        this.launchAndRun(command);
      }
    } catch (error) {
      throw new Error(
        `Failed to run command in Ghostty window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, _direction?: SplitDirection): DryRunInfo {
    const formattedCommand = this.formatCommandForDescription(command);
    const shortCommand = formattedCommand.replace(/"/g, '\\"');

    return {
      command: `osascript -e 'tell application "Ghostty" to activate' ...keystroke simulation for: "${shortCommand}"`,
      description: `Ghostty ${target} (experimental, requires Accessibility permissions): "${formattedCommand}"`,
      requiresPermissions: true,
    };
  }

  private createTabViaSystemEvents(command: string): void {
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `
tell application "Ghostty"
  activate
end tell
delay 0.2
tell application "System Events"
  keystroke "t" using command down
end tell
delay 0.1
tell application "System Events"
  keystroke "${escapedCommand}"
  key code 36
end tell
    `.trim();

    executeAppleScript(appleScript);
  }

  private createWindowViaSystemEvents(command: string): void {
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `
tell application "Ghostty"
  activate
end tell
delay 0.2
tell application "System Events"
  keystroke "n" using command down
end tell
delay 0.1
tell application "System Events"
  keystroke "${escapedCommand}"
  key code 36
end tell
    `.trim();

    executeAppleScript(appleScript);
  }

  private launchAndRun(command: string): void {
    // Launch Ghostty and let it open a window, then run the command
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `
tell application "Ghostty"
  activate
end tell
delay 0.5
tell application "System Events"
  keystroke "${escapedCommand}"
  key code 36
end tell
    `.trim();

    executeAppleScript(appleScript);
  }
}
