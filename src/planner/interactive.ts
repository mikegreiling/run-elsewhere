import type { Environment, Options, Plan, BackendType } from "../types.js";
import { createPlan } from "../planner.js";
import type { Backend } from "../run/backend.js";
import { selectBackendInteractive } from "../interactive/menu.js";
import { TmuxBackend } from "../run/tmux.js";
import { ZellijBackend } from "../run/zellij.js";
import { TerminalBackend } from "../run/macos/terminal.js";
import { ITerm2Backend } from "../run/macos/iterm2.js";
import { KittyBackend } from "../run/cli/kitty.js";
import { GhosttyBackend } from "../run/macos/ghostty.js";
import { WarpBackend } from "../run/macos/warp.js";

/**
 * Create a plan with optional interactive backend selection.
 *
 * If --interactive or -i is specified, always show menu.
 * If --yes/-y is specified, auto-select first available.
 * Otherwise (default), show menu if multiple backends available.
 */
export async function createPlanWithInteractive(
  command: string | undefined,
  options: Options,
  env: Environment
): Promise<Plan> {
  // If interactive mode requested, get all available backends and let user choose
  if (options.interactive) {
    const backends = getAllAvailableBackends(env);

    if (backends.length === 0) {
      return {
        type: "error",
        exitCode: 75,
        error: "No supported terminal backends available",
      };
    }

    try {
      const selection = await selectBackendInteractive(backends, env);

      // Force the selected backend by updating options
      // Type assertion is safe here because selection.backend.name cannot be "error"
      const backendName = selection.backend.name as Exclude<BackendType, "error">;
      const optionsWithForced: Options = {
        ...options,
        terminal: backendName,
        // If menu selected a target, use it
        ...(selection.target && { [selection.target]: true }),
      };

      return createPlan(command, optionsWithForced, env);
    } catch (error) {
      return {
        type: "error",
        exitCode: 1,
        error: `Interactive selection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // Otherwise, use the planner as normal
  // The planner will auto-select first available unless forced
  return createPlan(command, options, env);
}

/**
 * Get all backends available in the current environment
 */
function getAllAvailableBackends(env: Environment): Backend[] {
  const allBackends: Backend[] = [
    new TmuxBackend(),
    new ZellijBackend(),
    new TerminalBackend(),
    new ITerm2Backend(),
    new KittyBackend(),
    new GhosttyBackend(),
    new WarpBackend(),
  ];

  return allBackends.filter((b) => b.isAvailable(env));
}
