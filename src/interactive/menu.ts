import enquirer from "enquirer";
import type { Backend } from "../run/backend.js";
import type { Environment, TargetType } from "../types.js";

export interface MenuSelection {
  backend: Backend;
  target?: TargetType;
}

/**
 * Interactive backend selection menu.
 *
 * Shows available backends in priority order:
 * 1. Current multiplexer (if in one)
 * 2. Current terminal (if detected and supported)
 * 3. System backends: Terminal.app → kitty → iTerm2 → Ghostty → Warp
 *
 * Returns the selected backend and optionally the target type.
 */
export async function selectBackendInteractive(
  availableBackends: Backend[],
  env: Environment
): Promise<MenuSelection> {
  // Build choice list with context info
  const choices = availableBackends.map((backend) => {
    const contextHints: string[] = [];

    // Mark current context
    if (
      env.inTmux &&
      backend.name === "tmux"
    ) {
      contextHints.push("(current)");
    } else if (
      env.inZellij &&
      backend.name === "zellij"
    ) {
      contextHints.push("(current)");
    } else if (
      env.currentTerminal === backend.name &&
      (env.currentTerminal === "Terminal" ||
        env.currentTerminal === "iTerm2" ||
        env.currentTerminal === "kitty" ||
        env.currentTerminal === "Ghostty" ||
        env.currentTerminal === "Warp")
    ) {
      contextHints.push("(detected)");
    }

    // Mark experimental
    if (backend.capabilities.experimental) {
      contextHints.push("experimental");
    }

    // Build choice display
    const displayName =
      backend.name === "terminal" ? "Terminal.app" : backend.name;
    const target = getBackendTargets(backend).join("/");
    const context = contextHints.length > 0 ? ` [${contextHints.join(", ")}]` : "";

    return {
      name: `${displayName} (${target})${context}`,
      value: backend.name,
    };
  });

  // Prompt for backend selection
  const backendAnswer = (await enquirer.prompt([
    {
      type: "select",
      name: "backend",
      message: "Select terminal backend:",
      choices,
    },
  ])) as {
    backend: string;
  };

  // Find selected backend
  const selectedBackend = availableBackends.find(
    (b) => b.name === backendAnswer.backend
  );
  if (!selectedBackend) {
    throw new Error(`Backend not found: ${backendAnswer.backend}`);
  }

  // If backend supports multiple targets, ask which one
  const supportedTargets = getBackendTargets(selectedBackend);
  let targetChoice: TargetType | undefined;

  if (supportedTargets.length > 1) {
    const targetAnswer = (await enquirer.prompt([
      {
        type: "select",
        name: "target",
        message: "Select target type:",
        choices: supportedTargets,
      },
    ])) as {
      target: TargetType;
    };
    targetChoice = targetAnswer.target;
  } else if (supportedTargets.length === 1) {
    targetChoice = supportedTargets[0];
  }

  return {
    backend: selectedBackend,
    target: targetChoice,
  };
}

/**
 * Get supported target types for a backend
 */
function getBackendTargets(backend: Backend): TargetType[] {
  const targets: TargetType[] = [];
  if (backend.capabilities.pane) targets.push("pane");
  if (backend.capabilities.tab) targets.push("tab");
  if (backend.capabilities.window) targets.push("window");
  return targets;
}
