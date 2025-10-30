import type { Backend } from "../run/backend.js";
import type { Options, TargetType } from "../types.js";

export interface ResolvedTarget {
  /** The actual target type that will be used */
  target: TargetType;
  /** What the user explicitly requested (if anything) */
  requestedTarget?: TargetType;
  /** Was the target degraded due to lack of support? */
  degraded: boolean;
  /** Warning message if degraded (e.g., "pane not supported, using tab instead") */
  degradationWarning?: string;
}

/**
 * Resolves the target type (pane/tab/window) based on:
 * 1. What the user explicitly requested
 * 2. What the backend supports
 * 3. Degradation rules
 *
 * If user requested pane but backend doesn't support it, we degrade to tab.
 * If user requested tab but backend doesn't support it, we degrade to window.
 * If user requested window but backend doesn't support it, we fail.
 *
 * With --no flag, degradation is forbidden (strict mode).
 */
export function resolveTargetType(
  options: Options,
  backend: Backend
): ResolvedTarget {
  // Determine what target the user explicitly requested
  let requestedTarget: TargetType | undefined;
  if (options.pane) requestedTarget = "pane";
  if (options.tab) requestedTarget = "tab";
  if (options.window) requestedTarget = "window";

  // If user didn't specify, use smart default for this backend
  const targetToResolve = requestedTarget || getDefaultTarget(backend);

  // Try to resolve with degradation
  const result = tryResolveTarget(targetToResolve, backend, options.no ?? false);

  return {
    target: result.target,
    requestedTarget,
    degraded: result.degraded,
    degradationWarning: result.warning,
  };
}

/**
 * Gets the smart default target for a backend.
 * - For multiplexers (tmux/zellij): default to pane
 * - For GUI terminals: default to window
 */
function getDefaultTarget(backend: Backend): TargetType {
  if (backend.capabilities.pane) {
    return "pane";
  }
  // Fallback to window if available, otherwise tab
  if (backend.capabilities.window) {
    return "window";
  }
  if (backend.capabilities.tab) {
    return "tab";
  }
  // This shouldn't happen if backend is properly configured
  throw new Error(`Backend ${backend.name} supports neither pane, tab, nor window`);
}

/**
 * Internal function to try resolving a target type with degradation.
 */
function tryResolveTarget(
  target: TargetType,
  backend: Backend,
  strictMode: boolean
): {
  target: TargetType;
  degraded: boolean;
  warning?: string;
} {
  // Check if backend supports the requested target
  switch (target) {
    case "pane":
      if (backend.capabilities.pane) {
        return { target: "pane", degraded: false };
      }
      if (strictMode) {
        throw new Error(
          `${backend.name} does not support pane targets (use --no to fail strictly)`
        );
      }
      // Degrade: pane → tab
      if (backend.capabilities.tab) {
        return {
          target: "tab",
          degraded: true,
          warning: `${backend.name} does not support panes; degrading to tab`,
        };
      }
      // Further degrade: pane → tab → window
      if (backend.capabilities.window) {
        return {
          target: "window",
          degraded: true,
          warning: `${backend.name} does not support panes or tabs; degrading to window`,
        };
      }
      // Can't degrade further
      throw new Error(`${backend.name} does not support pane, tab, or window targets`);

    case "tab":
      if (backend.capabilities.tab) {
        return { target: "tab", degraded: false };
      }
      if (strictMode) {
        throw new Error(
          `${backend.name} does not support tab targets (use --no to fail strictly)`
        );
      }
      // Degrade: tab → window
      if (backend.capabilities.window) {
        return {
          target: "window",
          degraded: true,
          warning: `${backend.name} does not support tabs; degrading to window`,
        };
      }
      // Can't degrade further
      throw new Error(`${backend.name} does not support tab or window targets`);

    case "window":
      if (backend.capabilities.window) {
        return { target: "window", degraded: false };
      }
      // Windows are mandatory - no degradation possible
      throw new Error(`${backend.name} does not support window targets`);
  }
}

/**
 * Checks if a target can be achieved without degradation.
 * Useful for determining if user should be warned about forced degradation.
 */
export function canAchieveTargetWithoutDegradation(
  target: TargetType,
  backend: Backend
): boolean {
  switch (target) {
    case "pane":
      return backend.capabilities.pane;
    case "tab":
      return backend.capabilities.tab;
    case "window":
      return backend.capabilities.window;
  }
}
