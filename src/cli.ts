#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { detectEnvironment } from "./detect/env.js";
import { resolveCommand } from "./command.js";
import { createPlanWithInteractive } from "./planner/interactive.js";
import { EXIT_CODES } from "./constants.js";
import type { Options, BackendType } from "./types.js";
import type { Backend } from "./run/backend.js";
import { TmuxBackend } from "./run/tmux.js";
import { ZellijBackend } from "./run/zellij.js";
import { TerminalBackend } from "./run/macos/terminal.js";
import { ITerm2Backend } from "./run/macos/iterm2.js";
import { KittyBackend } from "./run/cli/kitty.js";
import { GhosttyBackend } from "./run/macos/ghostty.js";
import { WarpBackend } from "./run/macos/warp.js";
import packageJson from "../package.json" with { type: "json" };

/**
 * Get backend instance by type
 */
function getBackendInstance(backendType: BackendType): Backend {
  switch (backendType) {
    case "tmux":
      return new TmuxBackend();
    case "zellij":
      return new ZellijBackend();
    case "terminal":
      return new TerminalBackend();
    case "iTerm2":
      return new ITerm2Backend();
    case "kitty":
      return new KittyBackend();
    case "Ghostty":
      return new GhosttyBackend();
    case "Warp":
      return new WarpBackend();
    case "error":
      throw new Error("Cannot execute error plan type");
    default: {
      const _exhaustive: never = backendType;
      throw new Error(`Unknown backend type: ${String(_exhaustive)}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const argv = (await yargs(hideBin(process.argv))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("terminal", {
        type: "string",
        description: "Terminal backend: tmux, zellij, Terminal, iTerm2, kitty, Ghostty, or Warp",
        alias: "T",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("pane", {
        type: "boolean",
        description: "Create in pane (tmux/zellij)",
        alias: "p",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("tab", {
        type: "boolean",
        description: "Create in tab (iTerm2, kitty, Ghostty, Warp)",
        alias: "t",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("window", {
        type: "boolean",
        description: "Create in window (all terminals)",
        alias: "w",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("up", {
        type: "boolean",
        description: "Split direction: up",
        alias: "u",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("down", {
        type: "boolean",
        description: "Split direction: down",
        alias: "d",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("left", {
        type: "boolean",
        description: "Split direction: left",
        alias: "l",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("right", {
        type: "boolean",
        description: "Split direction: right (default)",
        alias: "r",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("yes", {
        type: "boolean",
        description: "Auto-select first available backend",
        alias: ["y", "no-tty"],
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("interactive", {
        type: "boolean",
        description: "Show interactive backend picker",
        alias: "i",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("no", {
        type: "boolean",
        description: "Strict mode: fail if exact target unavailable",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("command", {
        type: "string",
        description: "Command to run",
        alias: "c",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("dry-run", {
        type: "boolean",
        description: "Print plan as JSON and exit",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .version(packageJson.version)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .alias("v", "version")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .help()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .alias("h", "help")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .strict()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .parseAsync()) as {
      terminal?: string;
      pane?: boolean;
      tab?: boolean;
      window?: boolean;
      up?: boolean;
      down?: boolean;
      left?: boolean;
      right?: boolean;
      yes?: boolean;
      interactive?: boolean;
      no?: boolean;
      command?: string;
      "dry-run"?: boolean;
      _: (string | number)[];
    };

    // Extract command and remaining args
    const command = resolveCommand(
      argv.command,
      argv._ as string[],
      !process.stdin.isTTY
    );
    const options: Options = {
      terminal: argv.terminal as "tmux" | "Terminal" | "zellij" | "iTerm2" | "kitty" | "Ghostty" | "Warp" | undefined,
      pane: argv.pane,
      tab: argv.tab,
      window: argv.window,
      up: argv.up,
      down: argv.down,
      left: argv.left,
      right: argv.right,
      interactive: argv.interactive,
      no: argv.no,
      yes: argv.yes,
      dryRun: argv["dry-run"],
    };

    // Detect environment
    const env = detectEnvironment();

    // Create plan (with interactive selection if needed)
    const plan = await createPlanWithInteractive(command, options, env);

    // If --dry-run, output plan as JSON and exit
    if (options.dryRun) {
      // Format dry-run output with human-readable info + JSON
      if (plan.type === "error") {
        console.log(`Error: ${plan.error ?? "Unknown error"}`);
        const exitCode = plan.exitCode ?? EXIT_CODES.GENERIC_ERROR;
        console.log(`Exit code: ${String(exitCode)}`);
      } else {
        const backend = plan.type === "terminal" ? "Terminal.app" : plan.type;
        console.log(`Backend: ${backend}`);
        console.log(`Target: ${plan.target ?? "unknown"}`);
        if (plan.targetDegraded && plan.targetRequested && plan.target) {
          console.log(`⚠ Target degraded from ${plan.targetRequested} to ${plan.target}`);
        }
        if (plan.direction) {
          console.log(`Direction: ${plan.direction}`);
        }
        console.log("");
        console.log("Exact command:");
        console.log(plan.exactCommand);
        console.log("");
        console.log("Full plan:");
      }
      console.log(JSON.stringify(plan, null, 2));
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check for errors in plan
    if (plan.type === "error") {
      console.error(`Error: ${plan.error ?? "Unknown error"}`);
      process.exit(plan.exitCode ?? EXIT_CODES.GENERIC_ERROR);
    }

    // Execute plan using backend interface
    if (!plan.command || !plan.target) {
      throw new Error("Invalid plan: missing command or target");
    }

    // Type guard: plan.type cannot be "error" at this point (checked above)
    if (plan.type === "error") {
      throw new Error("Unexpected error plan type");
    }

    // Explicit type for getBackendInstance to help TypeScript
    const backendType: Exclude<BackendType, "error"> = plan.type;
    const backend: Backend = getBackendInstance(backendType);

    // Execute the command through the backend
    try {
      backend.run(plan.target, plan.command, plan.direction);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Backend execution failed: ${errorMessage}`);
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(EXIT_CODES.GENERIC_ERROR);
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error);
  console.error(`Fatal error: ${message}`);
  process.exit(EXIT_CODES.GENERIC_ERROR);
});
