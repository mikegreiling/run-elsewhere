export interface Options {
  terminal?: "tmux" | "Terminal" | "zellij";
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

export interface Plan {
  type: "tmux" | "terminal" | "zellij" | "error";
  command?: string;
  direction?: SplitDirection;
  exitCode?: number;
  error?: string;
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
}
