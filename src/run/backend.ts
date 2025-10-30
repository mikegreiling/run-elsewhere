import type { BackendType, SplitDirection, TargetType } from "../types.js";
import type { Environment } from "../types.js";

/**
 * Capabilities descriptor for what a backend supports.
 * This determines which target types (pane/tab/window) can be used,
 * and how features degrade if unavailable.
 */
export interface BackendCapabilities {
  /** This backend supports creating panes (tmux, zellij) */
  pane: boolean;
  /** This backend supports creating tabs (iTerm2, kitty, Terminal via windows) */
  tab: boolean;
  /** This backend supports creating windows (all GUI terminals) */
  window: boolean;
  /** Split directions supported (only relevant for pane backends) */
  directions: SplitDirection[];
  /** Experimental backend that may require special permissions */
  experimental: boolean;
}

/**
 * Dry-run command info for displaying what will be executed.
 */
export interface DryRunInfo {
  /** The exact command/script that will be executed */
  command: string;
  /** Human-readable description of what will happen */
  description: string;
  /** Whether this requires special permissions */
  requiresPermissions: boolean;
}

/**
 * Base interface for all terminal backend runners.
 * Each backend (tmux, iTerm2, kitty, etc.) implements this interface.
 */
export interface Backend {
  /** Backend identifier (matches BackendType) */
  name: BackendType;

  /** Capabilities of this backend */
  capabilities: BackendCapabilities;

  /**
   * Checks if this backend is usable in the current environment.
   * Should return true only if the backend is available AND appropriate
   * (e.g., tmux only returns true if inside tmux session).
   */
  isAvailable(env: Environment): boolean;

  /**
   * Runs a command in a pane (split direction).
   * Only called if capabilities.pane is true.
   * Throws if the backend doesn't support panes.
   */
  runPane(command: string, direction: SplitDirection): void;

  /**
   * Runs a command in a tab.
   * Only called if capabilities.tab is true.
   * Throws if the backend doesn't support tabs.
   */
  runTab(command: string): void;

  /**
   * Runs a command in a window.
   * Only called if capabilities.window is true.
   * Throws if the backend doesn't support windows.
   */
  runWindow(command: string): void;

  /**
   * Gets dry-run command info (what would be executed without actually doing it).
   * Used by --dry-run mode to show the exact command that would run.
   */
  getDryRunInfo(
    target: TargetType,
    command: string,
    direction?: SplitDirection
  ): DryRunInfo;
}

/**
 * Base class providing common functionality for all backends.
 * Subclasses override the methods they implement.
 */
export abstract class BaseBackend implements Backend {
  abstract name: BackendType;
  abstract capabilities: BackendCapabilities;

  abstract isAvailable(env: Environment): boolean;

  abstract runPane(command: string, direction: SplitDirection): void;
  abstract runTab(command: string): void;
  abstract runWindow(command: string): void;
  abstract getDryRunInfo(
    target: TargetType,
    command: string,
    direction?: SplitDirection
  ): DryRunInfo;

  /**
   * Helper to run a command by target type.
   * Routes to the appropriate method (runPane, runTab, runWindow).
   */
  protected run(
    target: TargetType,
    command: string,
    direction?: SplitDirection
  ): void {
    switch (target) {
      case "pane":
        if (!this.capabilities.pane) {
          throw new Error(`${this.name} does not support pane targets`);
        }
        if (!direction) {
          throw new Error("Direction required for pane target");
        }
        return this.runPane(command, direction);

      case "tab":
        if (!this.capabilities.tab) {
          throw new Error(`${this.name} does not support tab targets`);
        }
        return this.runTab(command);

      case "window":
        if (!this.capabilities.window) {
          throw new Error(`${this.name} does not support window targets`);
        }
        return this.runWindow(command);
    }
  }

  /**
   * Helper to format a command for human-readable output.
   * Truncates long commands for readability.
   */
  protected formatCommandForDescription(command: string, maxLength: number = 60): string {
    if (command.length <= maxLength) {
      return command;
    }
    return command.substring(0, maxLength - 3) + "...";
  }
}
