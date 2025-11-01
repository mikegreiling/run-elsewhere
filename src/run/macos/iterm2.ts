import { BaseBackend, type BackendCapabilities, type DryRunInfo } from "../backend.js";
import type { BackendType, SplitDirection, TargetType } from "../../types.js";
import type { Environment } from "../../types.js";
import { executeAppleScript } from "../../utils/applescript.js";
import { escapeForAppleScript } from "../../utils/escape.js";

export class ITerm2Backend extends BaseBackend {
  name: BackendType = "iTerm2";

  capabilities: BackendCapabilities = {
    pane: false, // TODO: Future iteration - iTerm2 panes via AppleScript are complex
    tab: true,
    window: true,
    directions: [],
    experimental: false,
  };

  isAvailable(env: Environment): boolean {
    return env.isMacOS && env.iTerm2Available;
  }

  runPane(_command: string, _direction: SplitDirection): void {
    throw new Error(
      "iTerm2 pane support not yet implemented. Please use --tab or --window instead. " +
        "Pane support is planned for a future iteration."
    );
  }

  runTab(command: string): void {
    try {
      const escapedCommand = escapeForAppleScript(command);
      const appleScript = `
tell application "iTerm"
  activate
  create window with default profile
  tell current session of current window
    write text "${escapedCommand}"
  end tell
end tell
      `.trim();

      executeAppleScript(appleScript);
    } catch (error) {
      throw new Error(
        `Failed to run command in iTerm2 tab: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  runWindow(command: string): void {
    try {
      const escapedCommand = escapeForAppleScript(command);
      const appleScript = `
tell application "iTerm"
  activate
  create window with default profile
  tell current session of current window
    write text "${escapedCommand}"
  end tell
end tell
      `.trim();

      executeAppleScript(appleScript);
    } catch (error) {
      throw new Error(
        `Failed to run command in iTerm2 window: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDryRunInfo(target: TargetType, command: string, _direction?: SplitDirection): DryRunInfo {
    const description = this.getDescription(target);
    const formattedCommand = this.formatCommandForDescription(command);
    const appleScript = this.generateAppleScript(command);

    return {
      command: `osascript -e '${appleScript.replace(/'/g, "'\\''")}'`,
      description: `iTerm2 ${description}: "${formattedCommand}"`,
      requiresPermissions: false,
    };
  }

  private getDescription(target: TargetType): string {
    switch (target) {
      case "tab":
        return "tab";
      case "window":
        return "window";
      case "pane":
        return "tab (panes not yet supported)";
    }
  }

  private generateAppleScript(command: string): string {
    const escapedCommand = escapeForAppleScript(command);
    return `
tell application "iTerm"
  activate
  create window with default profile
  tell current session of current window
    write text "${escapedCommand}"
  end tell
end tell
    `.trim();
  }
}
