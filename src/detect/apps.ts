import { execSync } from "child_process";

/**
 * Check if Terminal.app is available on macOS
 * Uses AppleScript's path to application command to find Terminal.app
 * regardless of its installation location (System/Applications, /Applications, etc.)
 */
export function isTerminalAppAvailable(): boolean {
  try {
    execSync(
      'osascript -e \'POSIX path of (path to application "Terminal")\'',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}
