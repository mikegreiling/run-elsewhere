/**
 * Detect if running in a remote session where GUI operations are infeasible
 */
export function isRemoteSession(): boolean {
  // SSH detection - most common
  if (process.env.SSH_TTY || process.env.SSH_CONNECTION) {
    return true;
  }

  // Mosh (mobile shell) detection - provides SSH-like functionality with roaming
  if (process.env.MOSH_CONNECTION) {
    return true;
  }

  // Could add more detection here for:
  // - Telnet (rarely used, hard to detect reliably)
  // - VS Code Remote (would set specific env vars)
  // - Other remote execution contexts

  return false;
}
