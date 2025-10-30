import { executeAppleScript } from "../utils/applescript.js";

/**
 * Check if Terminal.app is available on macOS
 * Uses AppleScript's path to application command to find Terminal.app
 * regardless of its installation location (System/Applications, /Applications, etc.)
 *
 * Returns false if in a remote session or if Terminal.app cannot be found.
 */
export function isTerminalAppAvailable(): boolean {
  try {
    executeAppleScript('POSIX path of (path to application "Terminal")');
    return true;
  } catch {
    // Returns false for both remote sessions and AppleScript failures
    return false;
  }
}
