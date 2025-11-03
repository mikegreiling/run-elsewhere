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
  // Build choice list with context info and display name mapping
  const displayNameToBackend = new Map<string, Backend>();
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
    } else if (env.currentTerminal === backend.name) {
      // Mark as detected if current terminal matches this backend
      // Excludes multiplexers (already handled above)
      const guiTerminals = ["terminal", "iTerm2", "kitty", "Ghostty", "Warp"];
      if (guiTerminals.includes(backend.name)) {
        contextHints.push("(detected)");
      }
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
    const choiceDisplay = `${displayName} (${target})${context}`;

    // Store mapping for lookup after selection
    displayNameToBackend.set(choiceDisplay, backend);

    return {
      name: choiceDisplay,
      value: choiceDisplay,
    };
  });

  // Prompt for backend selection
  const backendAnswer = await enquirer.prompt<{ backend: string }>([
    {
      type: "select",
      name: "backend",
      message: "Select terminal backend:",
      choices,
    },
  ]);

  // Find selected backend using the display name mapping
  const selectedBackend = displayNameToBackend.get(backendAnswer.backend);
  if (!selectedBackend) {
    throw new Error(`Backend not found: ${backendAnswer.backend}`);
  }

  // If backend supports multiple targets, ask which one
  const supportedTargets = getBackendTargets(selectedBackend);
  let targetChoice: TargetType | undefined;

  if (supportedTargets.length > 1) {
    const targetAnswer = await enquirer.prompt<{ target: TargetType }>([
      {
        type: "select",
        name: "target",
        message: "Select target type:",
        choices: supportedTargets,
      },
    ]);
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
