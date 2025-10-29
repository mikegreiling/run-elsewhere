import { readFileSync } from "fs";

/**
 * Resolve the command to run from multiple sources with precedence:
 * 1. -c flag
 * 2. args after --
 * 3. stdin (piped)
 */
export function resolveCommand(
  cFlag: string | undefined,
  argsAfterDash: string[],
  readFromStdin: boolean
): string | undefined {
  // Precedence 1: -c flag
  if (cFlag) {
    return cFlag;
  }

  // Precedence 2: args after --
  if (argsAfterDash.length > 0) {
    return argsAfterDash.join(" ");
  }

  // Precedence 3: stdin
  if (readFromStdin) {
    try {
      const stdinData = readFileSync(0, "utf-8");
      // Trim CRLF and trailing whitespace
      return stdinData.replace(/\r\n/g, "\n").trim() || undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
