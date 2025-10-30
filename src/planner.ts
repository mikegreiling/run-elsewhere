import type { Environment, Options, Plan, SplitDirection } from "./types.js";
import { EXIT_CODES, ERROR_MESSAGES, DEFAULT_SPLIT_DIRECTION } from "./constants.js";

/**
 * Generate a plan for running the command based on options and environment
 */
export function createPlan(
  command: string | undefined,
  options: Options,
  env: Environment
): Plan {
  // Check for --tab (not supported in Phase 1)
  if (options.tab) {
    return {
      type: "error",
      exitCode: EXIT_CODES.USAGE_ERROR,
      error: ERROR_MESSAGES.TAB_NOT_SUPPORTED,
    };
  }

  if (!command) {
    return {
      type: "error",
      exitCode: EXIT_CODES.USAGE_ERROR,
      error: ERROR_MESSAGES.NO_COMMAND_PROVIDED,
    };
  }

  // Check for forced terminal backend
  if (options.terminal) {
    if (options.terminal === "tmux") {
      return planTmux(command, options, env);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (options.terminal === "Terminal") {
      return planTerminal(command, options, env);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (options.terminal === "zellij") {
      return planZellij(command, options, env);
    } else {
      return {
        type: "error",
        exitCode: EXIT_CODES.USAGE_ERROR,
        error: ERROR_MESSAGES.INVALID_TERMINAL_OPTION,
      };
    }
  }

  // Auto path: no --terminal specified

  // SSH/headless guard
  if (env.inSSH) {
    if (env.inTmux) {
      return planTmux(command, options, env);
    } else {
      return {
        type: "error",
        exitCode: EXIT_CODES.SSH_GUI_INFEASIBLE,
        error: ERROR_MESSAGES.SSH_DETECTED_NO_TMUX,
      };
    }
  }

  // Try tmux first
  if (env.inTmux && env.tmuxAvailable) {
    return planTmux(command, options, env);
  }

  // Then try zellij
  if (env.inZellij && env.zellijAvailable) {
    return planZellij(command, options, env);
  }

  // Then try macOS Terminal
  if (env.isMacOS && env.terminalAppExists) {
    return planTerminal(command, options, env);
  }

  // No viable backend
  return {
    type: "error",
    exitCode: EXIT_CODES.NO_VIABLE_BACKEND,
    error: ERROR_MESSAGES.NO_SUPPORTED_TERMINAL,
  };
}

function planTmux(
  command: string,
  options: Options,
  env: Environment
): Plan {
  if (!env.inTmux || !env.tmuxAvailable) {
    return {
      type: "error",
      exitCode: EXIT_CODES.SOFTWARE_ERROR,
      error: ERROR_MESSAGES.TMUX_FORCED_NOT_AVAILABLE,
    };
  }

  const direction = getSplitDirection(options);

  const plan: Plan = {
    type: "tmux",
    command,
    direction,
  };
  return plan;
}

function planTerminal(
  command: string,
  _options: Options,
  env: Environment
): Plan {
  if (!env.isMacOS || !env.terminalAppExists) {
    return {
      type: "error",
      exitCode: EXIT_CODES.SOFTWARE_ERROR,
      error: ERROR_MESSAGES.TERMINAL_FORCED_NOT_AVAILABLE,
    };
  }

  const plan: Plan = {
    type: "terminal",
    command,
  };
  return plan;
}

function planZellij(
  command: string,
  options: Options,
  env: Environment
): Plan {
  if (!env.inZellij || !env.zellijAvailable) {
    return {
      type: "error",
      exitCode: EXIT_CODES.SOFTWARE_ERROR,
      error: ERROR_MESSAGES.ZELLIJ_FORCED_NOT_AVAILABLE,
    };
  }

  const direction = getSplitDirection(options);

  const plan: Plan = {
    type: "zellij",
    command,
    direction,
  };
  return plan;
}

function getSplitDirection(options: Options): SplitDirection {
  if (options.left || options.right) {
    return "h"; // horizontal split
  }
  if (options.up || options.down) {
    return "v"; // vertical split
  }
  return DEFAULT_SPLIT_DIRECTION; // default to horizontal (right)
}
