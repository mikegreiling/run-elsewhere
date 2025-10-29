import { execSync } from "child_process";

/**
 * Check if Terminal.app is available on macOS
 */
export function isTerminalAppAvailable(): boolean {
  try {
    execSync(
      'test -d "/Applications/Terminal.app"',
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}
