export const EXIT_CODES = {
  SUCCESS: 0,
  GENERIC_ERROR: 1,
  USAGE_ERROR: 64,
  SOFTWARE_ERROR: 70,
  SSH_GUI_INFEASIBLE: 73,
  NO_VIABLE_BACKEND: 75,
} as const;

export const DEFAULT_SPLIT_DIRECTION = "h" as const; // right/horizontal

export const ERROR_MESSAGES = {
  NO_COMMAND_PROVIDED: "No command provided. Use -c, --, or stdin.",
  SSH_DETECTED_NO_TMUX: "SSH detected and not inside tmux; cannot open GUI Terminal.",
  TMUX_FORCED_NOT_AVAILABLE: "Forced --terminal=tmux but tmux is not available or not in tmux session.",
  TERMINAL_FORCED_NOT_AVAILABLE:
    "Forced --terminal=Terminal but Terminal.app is not available or not on macOS.",
  ZELLIJ_FORCED_NOT_AVAILABLE:
    "Forced --terminal=zellij but zellij is not available or not in zellij session.",
  NO_SUPPORTED_TERMINAL: "No supported terminal available.",
  TAB_NOT_SUPPORTED:
    "--tab is not supported in Phase 1. Use --pane (tmux) or --window (Terminal).",
  INVALID_TERMINAL_OPTION: "Invalid --terminal option. Use 'tmux', 'zellij', or 'Terminal'.",
  STDIN_READ_ERROR: "Error reading from stdin.",
} as const;
