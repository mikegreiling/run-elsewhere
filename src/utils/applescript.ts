import { execSync } from "child_process";
import { isRemoteSession } from "../detect/remote.js";

/**
 * Execute AppleScript with guards for non-viable contexts
 *
 * AppleScript is macOS-only and triggers permission prompts in remote sessions,
 * which is undesirable when running via SSH, Mosh, or similar remote contexts.
 * This wrapper prevents unnecessary permission modals by blocking execution
 * on non-macOS systems and in remote terminal contexts.
 *
 * @param script - The AppleScript code to execute
 * @throws Error if not on macOS, in a remote session, or if AppleScript fails
 * @returns The output of the AppleScript execution
 */
export function executeAppleScript(script: string): string {
  // AppleScript is only available on macOS
  if (process.platform !== "darwin") {
    throw new Error("AppleScript is only available on macOS");
  }

  // Skip AppleScript in remote sessions to avoid permission prompts
  if (isRemoteSession()) {
    throw new Error(
      "AppleScript triggers permission prompts in remote sessions (SSH, Mosh, etc.)"
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
