import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";

export class WarpBackend extends BaseBackend {
  name: BackendType = "Warp";

  capabilities: BackendCapabilities = {
    pane: false,
    tab: true,
    window: true,
    directions: [],
    experimental: true,
  };

  isAvailable(env: Environment): boolean {
    return env.isMacOS && env.warpAvailable;
  }

  runPane(command: string, direction: SplitDirection): void {
    throw new Error(
      "Warp does not support pane targets. Please use --tab or --window instead."
    );
  }

  runTab(command: string): void {
    try {
      // Use System Events to send keyboard commands to Warp
      // Warp supports Cmd+T for new tab
      this.createTabViaSystemEvents(command);
    } catch (error) {
      throw new Error(
        `Failed to run command in Warp tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      // Use System Events to open new Warp window
      this.createWindowViaSystemEvents(command);
    } catch (error) {
      throw new Error(
        `Failed to run command in Warp window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, direction?: SplitDirection): DryRunInfo {
    const formattedCommand = this.formatCommandForDescription(command);
    const shortCommand = formattedCommand.replace(/"/g, '\\"');

    return {
      command: `osascript -e 'tell application "Warp" to activate' ...keystroke simulation for: "${shortCommand}"`,
      description: `Warp ${target} (experimental, requires Accessibility permissions): "${formattedCommand}"`,
      requiresPermissions: true,
    };
  }

  private createTabViaSystemEvents(command: string): void {
    const escapedCommand = escapeForAppleScript(command);
    const appleScript = `
tell application "Warp"
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
tell application "Warp"
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
}

/**
 * Escape a string for use in AppleScript
 */
function escapeForAppleScript(str: string): string {
  // Escape backslashes first, then double quotes
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
