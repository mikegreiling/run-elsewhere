import type { Environment, Options, Plan, SplitDirection } from "./types.js";
import { EXIT_CODES, ERROR_MESSAGES, DEFAULT_SPLIT_DIRECTION } from "./constants.js";
import { resolveTargetType } from "./planner/targets.js";
import type { Backend } from "./run/backend.js";
import { TmuxBackend } from "./run/tmux.js";
import { ZellijBackend } from "./run/zellij.js";
import { TerminalBackend } from "./run/macos/terminal.js";
import { ITerm2Backend } from "./run/macos/iterm2.js";
import { KittyBackend } from "./run/cli/kitty.js";
import { GhosttyBackend } from "./run/macos/ghostty.js";
import { WarpBackend } from "./run/macos/warp.js";

/**
 * Generate a plan for running the command based on options and environment
 *
 * Stage 1: Validate command exists
 * Stage 2: Detect available backends based on environment
 * Stage 3: Filter viable backends (SSH guard, forced backend)
 * Stage 4: Select backend (forced, auto, or interactive)
 * Stage 5: Resolve target type (pane/tab/window)
 * Stage 6: Generate plan with exact commands
 */
export function createPlan(
  command: string | undefined,
  options: Options,
  env: Environment
): Plan {
  // Stage 1: Validate command
  if (!command) {
    return {
      type: "error",
      exitCode: EXIT_CODES.USAGE_ERROR,
      error: ERROR_MESSAGES.NO_COMMAND_PROVIDED,
    };
  }

  // Create all backend instances
  const backends: Backend[] = [
    new TmuxBackend(),
    new ZellijBackend(),
    new TerminalBackend(),
    new ITerm2Backend(),
    new KittyBackend(),
    new GhosttyBackend(),
    new WarpBackend(),
  ];

  // Stage 2: Detect available backends
  const availableBackends = backends.filter((b) => b.isAvailable(env));

  // Stage 3: Filter viable backends based on context
  let viableBackends = filterViableBackends(availableBackends, env);

  // Handle forced backend
  if (options.terminal) {
    // Map user input to backend names (case-insensitive matching)
    const backendNameMap: Record<string, string> = {
      tmux: "tmux",
      Terminal: "terminal",
      terminal: "terminal",
      iTerm2: "iTerm2",
      iterm2: "iTerm2",
      kitty: "kitty",
      Ghostty: "Ghostty",
      ghostty: "Ghostty",
      Warp: "Warp",
      warp: "Warp",
      zellij: "zellij",
    };

    const mappedName = backendNameMap[options.terminal];
    if (!mappedName) {
      const validOptions = Object.keys(backendNameMap).sort();
      return {
        type: "error",
        exitCode: EXIT_CODES.USAGE_ERROR,
        error: `Invalid terminal option: ${options.terminal}. Valid options are: ${validOptions.join(", ")}`,
      };
    }

    viableBackends = viableBackends.filter((b) => b.name === mappedName);

    if (viableBackends.length === 0) {
      return {
        type: "error",
        exitCode: EXIT_CODES.SOFTWARE_ERROR,
        error: `${options.terminal} is not available in this environment`,
      };
    }
  }

  // Stage 4: Select backend
  // Three modes: forced (--terminal), auto (first available), or interactive (-i)
  // Note: Interactive mode is handled by createPlanWithInteractive() wrapper
  if (options.interactive) {
    return {
      type: "error",
      exitCode: EXIT_CODES.USAGE_ERROR,
      error: "Interactive mode must be called via createPlanWithInteractive(). This is a programming error.",
    };
  }

  let selectedBackend: Backend;

  if (options.yes || options.noTty) {
    // Auto-select first available
    if (viableBackends.length === 0) {
      // SSH guard: if in SSH but no viable backend, return SSH-specific error
      if (env.inSSH) {
        return {
          type: "error",
          exitCode: EXIT_CODES.SSH_GUI_INFEASIBLE,
          error: ERROR_MESSAGES.SSH_DETECTED_NO_MULTIPLEXER,
        };
      }
      return {
        type: "error",
        exitCode: EXIT_CODES.NO_VIABLE_BACKEND,
        error: ERROR_MESSAGES.NO_SUPPORTED_TERMINAL,
      };
    }
    selectedBackend = viableBackends[0];
  } else if (viableBackends.length === 0) {
    // SSH guard: if in SSH but no viable backend, return SSH-specific error
    if (env.inSSH) {
      return {
        type: "error",
        exitCode: EXIT_CODES.SSH_GUI_INFEASIBLE,
        error: ERROR_MESSAGES.SSH_DETECTED_NO_MULTIPLEXER,
      };
    }
    return {
      type: "error",
      exitCode: EXIT_CODES.NO_VIABLE_BACKEND,
      error: ERROR_MESSAGES.NO_SUPPORTED_TERMINAL,
    };
  } else {
    // Auto-select first available
    selectedBackend = viableBackends[0];
  }

  // Stage 5: Resolve target type
  try {
    const resolvedTarget = resolveTargetType(options, selectedBackend);

    // Stage 6: Generate plan
    const direction = getSplitDirection(options);
    const dryRunInfo = selectedBackend.getDryRunInfo(
      resolvedTarget.target,
      command,
      direction
    );

    const plan: Plan = {
      type: selectedBackend.name,
      command,
      direction: resolvedTarget.target === "pane" ? direction : undefined,
      target: resolvedTarget.target,
      targetRequested: resolvedTarget.requestedTarget,
      targetDegraded: resolvedTarget.degraded,
      exactCommand: dryRunInfo.command,
    };

    return plan;
  } catch (error) {
    return {
      type: "error",
      exitCode: EXIT_CODES.SOFTWARE_ERROR,
      error: `Failed to plan command: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Filter backends to only those that are viable in the current context.
 *
 * SSH/Remote Guard: If in SSH but not in multiplexer, block GUI backends
 * VSCode/Cursor: Treated as unsupported terminals (will trigger interactive menu or auto-select)
 */
function filterViableBackends(backends: Backend[], env: Environment): Backend[] {
  // SSH/remote guard: if in SSH/Mosh but not in multiplexer, only allow multiplexers
  if (env.inSSH) {
    // Only tmux/zellij are viable in SSH
    return backends.filter((b) => b.name === "tmux" || b.name === "zellij");
  }

  // VSCode/Cursor detected terminals are handled by interactive menu or auto-selection
  // The detection helps with context hints in the menu

  return backends;
}

function getSplitDirection(options: Options): SplitDirection {
  if (options.left) {
    return "left";
  }
  if (options.right) {
    return "right";
  }
  if (options.up) {
    return "up";
  }
  if (options.down) {
    return "down";
  }
  return DEFAULT_SPLIT_DIRECTION;
}
