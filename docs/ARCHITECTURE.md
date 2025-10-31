# Architecture

This document describes the internal design of `run-elsewhere`.

## Design Goals

1. **Automatic backend selection** - Detect the user's environment and choose the best terminal backend without requiring configuration
2. **Graceful degradation** - If a requested target type is unsupported, degrade to the next best option with a warning
3. **Extensibility** - Easy to add new terminal backends through a common interface
4. **Type safety** - Full TypeScript coverage with strict types
5. **Testability** - Pure functions and dependency injection for easy unit testing

## System Overview

```
User Input → CLI Parser → Planner → Backend → Terminal
                ↓
         Environment Detection
```

The system flows through 6 stages:

1. **Parse** - CLI flags and command resolution
2. **Detect** - Environment and available backends
3. **Filter** - Remove incompatible backends (e.g., SSH blocking GUI)
4. **Select** - Choose backend (forced, auto, or interactive)
5. **Resolve** - Determine target type with degradation
6. **Execute** - Run command via backend

## Backend Abstraction

### Backend Interface

All terminal backends implement the `Backend` interface:

```typescript
interface Backend {
  name: BackendType;
  capabilities: BackendCapabilities;

  isAvailable(env: Environment): boolean;
  runPane(command: string, direction: SplitDirection): void;
  runTab(command: string): void;
  runWindow(command: string): void;
  getDryRunInfo(...): DryRunInfo;
}
```

### Capabilities System

Each backend declares what it supports:

```typescript
interface BackendCapabilities {
  pane: boolean;           // tmux, zellij only
  tab: boolean;            // iTerm2, kitty, Ghostty, Warp
  window: boolean;         // all backends
  directions: SplitDirection[];  // [] or [left,right,up,down]
  experimental: boolean;   // Ghostty, Warp (System Events)
}
```

This drives:
- Target resolution (what's possible)
- Degradation rules (fallback chain)
- UI hints (experimental badge)

### Backend Implementations

**CLI-based:**
- `TmuxBackend` - Uses `tmux split-window` + `tmux send-keys`
- `ZellijBackend` - Uses `zellij action new-pane` + `write-chars` + `write 13`
- `KittyBackend` - Uses `kitty @ launch --type=tab/os-window`

**AppleScript-based:**
- `TerminalBackend` - `tell application "Terminal"` + `do script`
- `ITerm2Backend` - `tell application "iTerm"` + `create window` + `write text`

**System Events-based (experimental):**
- `GhosttyBackend` - Activates app, sends Cmd+T keystroke, types command, presses Enter
- `WarpBackend` - Activates app, sends Cmd+T keystroke, types command, presses Enter

## 6-Stage Planner Pipeline

Located in `src/planner.ts`:

### Stage 1: Validate Command

```typescript
if (!command) {
  return { type: "error", exitCode: 64, error: "No command provided" };
}
```

### Stage 2: Detect Available Backends

```typescript
const backends = [
  new TmuxBackend(),
  new ZellijBackend(),
  // ... all 7 backends
];
const availableBackends = backends.filter(b => b.isAvailable(env));
```

### Stage 3: Filter Viable Backends

Applies context-specific constraints:

```typescript
if (env.inSSH) {
  // Only multiplexers work over SSH
  viableBackends = availableBackends.filter(b =>
    b.name === "tmux" || b.name === "zellij"
  );
}
```

### Stage 4: Select Backend

Three modes:

1. **Forced** (`--terminal=NAME`):
   ```typescript
   if (options.terminal) {
     viableBackends = viableBackends.filter(b => b.name === mappedName);
   }
   ```

2. **Auto-select** (`-y/--yes` or default):
   ```typescript
   selectedBackend = viableBackends[0];  // First available
   ```

3. **Interactive** (`-i/--interactive`):
   ```typescript
   const selection = await selectBackendInteractive(backends, env);
   ```

### Stage 5: Resolve Target Type

Uses `src/planner/targets.ts`:

```typescript
const resolvedTarget = resolveTargetType(options, selectedBackend);

// Degradation chain:
// pane (unsupported) → tab (check) → window (fallback)
// tab (unsupported) → window (fallback)
// window (unsupported) → ERROR
```

**Smart defaults:**
- Multiplexers (tmux/zellij): `pane`
- GUI terminals: `window`

**Strict mode (`--no` flag):**
- Prevents degradation
- Fails instead with clear error message

### Stage 6: Generate Plan

```typescript
const plan: Plan = {
  type: selectedBackend.name,
  command,
  target: resolvedTarget.target,
  targetDegraded: resolvedTarget.degraded,
  direction: resolvedTarget.target === "pane" ? direction : undefined,
  exactCommand: selectedBackend.getDryRunInfo(...).command
};
```

## Terminal Detection

Located in `src/detect/terminal.ts`:

### Detection Methods

Priority order:

1. **$TERM_PROGRAM** (most reliable):
   ```bash
   iTerm.app → iTerm2
   Apple_Terminal → Terminal
   vscode → VSCode
   kitty → kitty
   ```

2. **$LC_TERMINAL** (fallback):
   ```bash
   Some terminals set this
   ```

3. **Parent process** (last resort):
   ```bash
   ps -p $PPID -o comm=
   ```

### Mapping Logic

Case-insensitive substring matching:
```typescript
"iterm" → iTerm2
"terminal" (not vscode/cursor) → Terminal
"kitty" → kitty
```

### Unsupported Terminals

VSCode and Cursor integrated terminals are detected but unsupported:
- Can't open new terminals within them
- Fall back to system terminals
- Interactive menu shows alternatives

## Target Degradation

When a backend doesn't support the requested target:

```
Requested     Backend Supports     Result
--------      ----------------     ------
pane          tab + window         → tab (degraded)
pane          window only          → window (degraded)
tab           window only          → window (degraded)
window        tab only             → ERROR (window is mandatory)
```

### Degradation Warnings

Users see:
```
⚠ Terminal.app does not support tabs; degrading to window
```

Unless they use `--no` flag (strict mode):
```
Error: Terminal.app does not support tab targets
```

## Interactive Mode

Located in `src/interactive/menu.ts`:

### Menu Display

```
? Select terminal backend:
  ❯ Terminal.app (window) [detected]
    iTerm2 (tab/window)
    kitty (tab/window)
    Ghostty (tab/window) [experimental]
    Warp (tab/window) [experimental]
```

**Context hints:**
- `(current)` - Currently inside this multiplexer
- `(detected)` - Your current terminal (via $TERM_PROGRAM)
- `[experimental]` - Uses System Events (Accessibility permissions required)

**Priority order:**
1. Current multiplexer (if in one)
2. Detected terminal (if supported)
3. System backends by reliability: Terminal.app → kitty → iTerm2 → Ghostty → Warp

### Target Selection

If backend supports multiple targets (e.g., iTerm2 has tab+window):
```
? Select target type:
  ❯ tab
    window
```

## Command Escaping

Different backends require different escaping:

### tmux/zellij (double-quoted shell)
```typescript
command.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
```

### kitty (double-quoted with $`\ escaping)
```typescript
command
  .replace(/\\/g, "\\\\")
  .replace(/"/g, '\\"')
  .replace(/\$/g, "\\$")
  .replace(/`/g, "\\`")
```

### AppleScript (backslash + quote escaping)
```typescript
command.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
```

Then wrapped in osascript's single-quote escaping:
```bash
osascript -e 'tell application "Terminal"
  do script "echo \"test\""
end tell'
```

## SSH Detection

Located in `src/detect/remote.ts`:

Checks for:
- `$SSH_TTY` - Set by OpenSSH
- `$SSH_CONNECTION` - Set by OpenSSH
- `$MOSH_CONNECTION` - Set by Mosh

When SSH detected:
- GUI terminals are blocked (can't open remote windows)
- Only tmux/zellij are viable
- Clear error if neither available

## Error Handling

Exit codes:
- `0` - Success
- `1` - Generic failure
- `64` - Usage error (bad flags, no command)
- `70` - Software error (backend unavailable)
- `73` - SSH without multiplexer (GUI infeasible)
- `75` - No viable backend available

Each error includes:
- Clear message explaining the problem
- Suggestions for fixing (e.g., "Use --terminal=tmux")
- Exit code for programmatic handling

## Testing Strategy

### Unit Tests (170 tests)

- **Terminal detection** - All $TERM_PROGRAM mappings
- **Target resolution** - Degradation rules, strict mode
- **Backend capabilities** - Each backend's declarations
- **Backend getDryRunInfo()** - Command generation, escaping
- **Planner logic** - All stages, error paths
- **Base class** - Common backend functionality

### Integration Testing

Manual testing covers:
- Each backend's actual execution (requires that terminal)
- SSH scenarios (requires SSH connection)
- AppleScript permissions (requires user approval)
- Interactive menu (requires TTY)

## Future Enhancements

- Linux support (wezterm, gnome-terminal, konsole)
- Windows support (Windows Terminal)
- Pane support for GUI terminals (iTerm2 splits)
- Config file (~/.elsewhere/config.json)
- Plugin system for custom backends
