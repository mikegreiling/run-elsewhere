#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { detectEnvironment } from "./detect/env.js";
import { resolveCommand } from "./command.js";
import { createPlan } from "./planner.js";
import { runInTmuxPane } from "./run/tmux.js";
import { runInTerminalApp } from "./run/macos/terminal.js";
import { EXIT_CODES } from "./constants.js";
import type { Options } from "./types.js";

const packageJson = {
  name: "run-elsewhere",
  version: "0.1.0",
};

async function main(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const argv = (await yargs(hideBin(process.argv))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("terminal", {
        type: "string",
        description: "Terminal backend to use: 'tmux' or 'Terminal'",
        alias: "T",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("pane", {
        type: "boolean",
        description: "Require pane (tmux only)",
        alias: "p",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("tab", {
        type: "boolean",
        description: "[Phase 2] Create new tab",
        alias: "t",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("window", {
        type: "boolean",
        description: "Create new window",
        alias: "w",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("up", {
        type: "boolean",
        description: "[tmux] Split upward",
        alias: "u",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("down", {
        type: "boolean",
        description: "[tmux] Split downward",
        alias: "d",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("left", {
        type: "boolean",
        description: "[tmux] Split left",
        alias: "l",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("right", {
        type: "boolean",
        description: "[tmux] Split right",
        alias: "r",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("yes", {
        type: "boolean",
        description: "Non-interactive mode",
        alias: ["y", "no-tty"],
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("interactive", {
        type: "boolean",
        description: "[Phase 2] Interactive mode",
        alias: "i",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .option("no", {
        type: "boolean",
        description: "[Phase 2] Dry-run without executing",
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
      terminal: argv.terminal as "tmux" | "Terminal" | undefined,
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

    // Create plan
    const plan = createPlan(command, options, env);

    // If --dry-run, output plan as JSON and exit
    if (options.dryRun) {
      console.log(JSON.stringify(plan, null, 2));
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check for errors in plan
    if (plan.type === "error") {
      console.error(`Error: ${plan.error ?? "Unknown error"}`);
      process.exit(plan.exitCode ?? EXIT_CODES.GENERIC_ERROR);
    }

    // Execute plan
    if (plan.type === "tmux") {
      if (!plan.command || !plan.direction) {
        throw new Error("Invalid tmux plan: missing command or direction");
      }
      runInTmuxPane(plan.command, plan.direction);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (plan.type === "terminal") {
      if (!plan.command) {
        throw new Error("Invalid terminal plan: missing command");
      }
      runInTerminalApp(plan.command);
    } else {
      const _exhaustive: never = plan.type;
      throw new Error(`Unknown plan type: ${String(_exhaustive)}`);
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
