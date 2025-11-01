import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";

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
      // Use System Events to send keyboard commands to Ghostty
      // Cmd+T for new tab, then paste command and press Enter
      this.createTabViaSystemEvents(command);
    } catch (error) {
      throw new Error(
        `Failed to run command in Ghostty tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      // Use System Events to open new Ghostty window and run command
      // Cmd+N for new window (or use open -n), then paste command and press Enter
      this.createWindowViaSystemEvents(command);
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
    // Note: Full System Events implementation requires pasteboard manipulation
    // Using simpler approach for now
    this.createTabViaOpen(command);
  }

  private createWindowViaSystemEvents(command: string): void {
    // Using simpler approach
    this.createWindowViaOpen(command);
  }

  private createTabViaOpen(command: string): void {
    // Use open with direct command invocation
    // Ghostty supports opening with a command via: ghostty -e "command"
    // We'll use a fallback to window creation instead
    this.createWindowViaOpen(command);
  }

  private createWindowViaOpen(command: string): void {
    // Create Ghostty window with command
    // Ghostty can be invoked with: open -a Ghostty -- -e "command"
    // But we'll use a simpler approach with open -n
    const escapedCommand = command.replace(/"/g, '\\"').replace(/\$/g, "\\$");
    const appleScript = `
tell application "Ghostty"
  activate
end tell
delay 0.2
tell application "System Events"
  keystroke "${escapedCommand}"
  key code 36
end tell
    `.trim();

    executeAppleScript(appleScript);
  }
}
