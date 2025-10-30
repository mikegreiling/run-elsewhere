import { execSync } from "child_process";
import { isRemoteSession } from "../detect/remote.js";

/**
 * Execute AppleScript with remote session guard
 *
 * AppleScript requires macOS user interaction and cannot be executed in remote sessions.
 * This wrapper prevents permission prompts and AppleScript errors when running in SSH,
 * Mosh, or other remote terminal contexts.
 *
 * @param script - The AppleScript code to execute
 * @throws Error if in a remote session or if AppleScript fails
 * @returns The output of the AppleScript execution
 */
export function executeAppleScript(script: string): string {
  if (isRemoteSession()) {
    throw new Error(
      "Cannot execute AppleScript in remote session (SSH, Mosh, etc.)"
    );
  }

  try {
    return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
    }).trim();
  } catch (error) {
    throw new Error(
      `AppleScript execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
