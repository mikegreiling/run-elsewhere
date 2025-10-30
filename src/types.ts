import type { SupportedTerminal } from "./detect/terminal.js";

export interface Options {
  terminal?: "tmux" | "Terminal" | "zellij" | "iTerm2" | "kitty" | "Ghostty" | "Warp";
  pane?: boolean;
  tab?: boolean;
  window?: boolean;
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
  interactive?: boolean;
  no?: boolean;
  yes?: boolean;
  noTty?: boolean;
  command?: string;
  dryRun?: boolean;
}

export type SplitDirection = "left" | "right" | "up" | "down";

export type BackendType = "tmux" | "terminal" | "zellij" | "iTerm2" | "kitty" | "Ghostty" | "Warp" | "error";

export type TargetType = "pane" | "tab" | "window";

export interface Plan {
  type: BackendType;
  command?: string;
  direction?: SplitDirection;
  target?: TargetType; // Requested target (pane/tab/window)
  targetRequested?: TargetType; // What user explicitly asked for
  targetDegraded?: boolean; // Was target degraded due to unsupported feature?
  exitCode?: number;
  error?: string;
  exactCommand?: string; // The exact CLI/AppleScript command that will run
  alternatives?: string[]; // Other backends that could work
}

export interface Result {
  success: boolean;
  exitCode: number;
  output?: string;
  error?: string;
}

export interface Environment {
  inTmux: boolean;
  inSSH: boolean;
  isMacOS: boolean;
  terminalAppExists: boolean;
  tmuxAvailable: boolean;
  inZellij: boolean;
  zellijAvailable: boolean;

  // Phase 2: New backend detection
  inITerm2: boolean;
  iTerm2Available: boolean;
  inKitty: boolean;
  kittyAvailable: boolean;
  inGhostty: boolean;
  ghosttyAvailable: boolean;
  inWarp: boolean;
  warpAvailable: boolean;

  // VSCode/Cursor (special - unsupported terminals)
  inVSCode: boolean;
  inCursor: boolean;

  // Detected current terminal
  currentTerminal: SupportedTerminal;
}
