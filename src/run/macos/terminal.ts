import { executeAppleScript } from "../../utils/applescript.js";

/**
 * Run a command in a new Terminal.app window
 */
export function runInTerminalApp(command: string): void {
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

/**
 * Escape a string for use in AppleScript
 */
function escapeForAppleScript(str: string): string {
  // Escape backslashes first, then double quotes
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
