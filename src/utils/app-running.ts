import { executeAppleScript } from "./applescript.js";

/**
 * Check if a macOS application is currently running.
 * Uses AppleScript to query the system.
 *
 * @param appName - The name of the application (e.g., "Ghostty", "Warp")
 * @returns true if the app is running, false otherwise
 * @throws Error if not on macOS or if AppleScript execution fails
 */
export function isAppRunning(appName: string): boolean {
  try {
    const appleScript = `
tell application "System Events"
  return (count of (every process whose name is "${appName}")) > 0
end tell
    `.trim();

    const result = executeAppleScript(appleScript);
    return result.trim() === "true";
  } catch {
    // If we can't determine, assume not running
    return false;
  }
}
