/**
 * Escape a string for use in AppleScript double-quoted strings.
 * Used by Terminal.app, iTerm2, Ghostty, Warp backends.
 */
export function escapeForAppleScript(str: string): string {
  // Escape backslashes first, then double quotes
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Escape a string for use in shell double-quoted strings.
 * Used by kitty and other CLI-based backends.
 * Escapes: backslash, double quote, dollar sign, backtick
 */
export function escapeForShell(str: string): string {
  return str
    .replace(/\\/g, "\\\\") // backslash
    .replace(/"/g, '\\"') // double quote
    .replace(/\$/g, "\\$") // dollar sign
    .replace(/`/g, "\\`"); // backtick
}
