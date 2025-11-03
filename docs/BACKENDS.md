# Backend Details

Comprehensive reference for all supported terminal backends.

## Backend Comparison

| Backend | Type | Supports | Experimental | Permissions |
|---------|------|----------|--------------|-------------|
| **tmux** | Multiplexer | pane, tab, window | No | None |
| **zellij** | Multiplexer | pane, tab, window | No | None |
| **Terminal.app** | macOS GUI | window | No | None |
| **iTerm2** | macOS GUI | tab, window | No | None |
| **kitty** | Cross-platform GUI | tab, window | No | None |
| **Ghostty** | macOS GUI | tab, window | Yes | Accessibility |
| **Warp** | macOS GUI | tab, window | Yes | Accessibility |

## tmux

### How It Works

Uses tmux's native commands:
1. `tmux split-window -h/-v [-b]` - Creates new pane (for `--pane`)
2. `tmux new-window` - Creates new window (for `--tab`)
3. `tmux send-keys "command" Enter` - Executes command

For `--window`, detects the underlying GUI terminal emulator via `$TERM_PROGRAM` and delegates to it:
- If detected (kitty, iTerm2, Ghostty, Warp, Terminal.app): Creates window in that GUI terminal
- If not detected: Falls back to creating a tmux window

### Capabilities

- ✅ Panes (all 4 directions: left, right, up, down)
- ✅ Tabs (creates tmux windows, analogous to GUI tabs)
- ✅ GUI windows (with detection and delegation)

### Requirements

- Must be inside an active tmux session (`$TMUX` set)
- `tmux` binary available in `$PATH`

### Known Issues

**Terminal detection from multiplexers** - When using `--window`, terminal detection relies on `$TERM_PROGRAM` which reflects the environment when tmux was _started_, not the current client. See Troubleshooting for details and workarounds.

### Examples

```bash
# Pane (default)
elsewhere -c "npm run dev"
# Creates: tmux split-window -h && tmux send-keys "npm run dev" Enter

# Tab (creates tmux window)
elsewhere --tab -c "npm run dev"
# Creates: tmux new-window && tmux send-keys "npm run dev" Enter

# GUI window (delegates to underlying terminal)
elsewhere --window -c "npm run dev"
# Creates new window in detected GUI terminal (kitty, iTerm2, etc.)
```

## zellij

### How It Works

Uses zellij's action commands:
1. `zellij action new-pane --direction` - Creates new pane (for `--pane`)
2. `zellij action new-tab` - Creates new tab (for `--tab`)
3. `zellij action write-chars "command"` - Types command
4. `zellij action write 13` - Presses Enter (ASCII 13)

For `--window`, detects the underlying GUI terminal emulator via `$TERM_PROGRAM` and delegates to it:
- If detected (kitty, iTerm2, Ghostty, Warp, Terminal.app): Creates window in that GUI terminal
- If not detected: Falls back to creating a zellij tab

### Capabilities

- ✅ Panes (all 4 directions: left, right, up, down)
- ✅ Tabs (creates zellij tabs)
- ✅ GUI windows (with detection and delegation)

### Requirements

- Must be inside an active zellij session (`$ZELLIJ` set)
- `zellij` binary available in `$PATH`

### Known Issues

**Direction bug** - The `--direction` flag doesn't work correctly in zellij (pane target only):
- up/down always opens below
- left/right always opens after

This is a zellij issue, not a run-elsewhere bug.

**Tracking:** https://github.com/zellij-org/zellij/issues/3332

**Terminal detection from multiplexers** - When using `--window`, terminal detection relies on `$TERM_PROGRAM` which reflects the environment when zellij was _started_, not the current client. See Troubleshooting for details and workarounds.

### Examples

```bash
# Pane (default)
elsewhere -c "npm run dev"
# Creates: zellij action new-pane --direction "Right"
#         zellij action write-chars "npm run dev"
#         zellij action write 13

# Tab (creates zellij tab)
elsewhere --tab -c "npm run dev"
# Creates: zellij action new-tab
#         zellij action write-chars "npm run dev"
#         zellij action write 13

# GUI window (delegates to underlying terminal)
elsewhere --window -c "npm run dev"
# Creates new window in detected GUI terminal (kitty, iTerm2, etc.)
```

## Terminal.app

### How It Works

Uses AppleScript to automate Terminal.app:

```applescript
tell application "Terminal"
  activate
  do script "command"
end tell
```

### Capabilities

- ❌ Panes
- ❌ Tabs (not supported via AppleScript - see limitations)
- ✅ Windows (creates new windows)

### Requirements

- macOS only
- Terminal.app must be available (always present on macOS)

### Known Issues

**No tab support via AppleScript** - The `do script` command in Terminal.app has no native way to create tabs:
- `do script "command"` → creates a NEW WINDOW
- `do script "command" in window 1` → runs in the CURRENT TAB (does not create new tab)

There is no AppleScript command to create a new tab in Terminal.app. If you request `--tab`, it will automatically degrade to `--window` unless you use `--no` flag (strict mode).

### Examples

```bash
# Window (default)
elsewhere -c "npm run dev"
# Creates: osascript -e 'tell application "Terminal"
#            activate
#            do script "npm run dev"
#          end tell'

# Tab requested but degraded to window
elsewhere --tab -c "npm run dev"
# ⚠ Terminal does not support tabs; degrading to window
# Behaves same as above
```

## iTerm2

### How It Works

Uses AppleScript to automate iTerm2:

```applescript
tell application "iTerm"
  activate
  create window with default profile
  tell current session of current window
    write text "command"
  end tell
end tell
```

### Capabilities

- ❌ Panes (deferred to future iteration - AppleScript splits are complex)
- ✅ Tabs
- ✅ Windows

### Requirements

- macOS only
- iTerm2 must be installed and detectable

### Known Issues

**Pane support not implemented** - iTerm2 supports split panes, but the AppleScript API for managing them is complex. Planned for a future iteration.

If you request `--pane`, it degrades to `--tab` unless you use `--no` flag.

### Example

```bash
elsewhere --tab -c "npm run dev"
# Creates: osascript -e 'tell application "iTerm"
#            activate
#            create window with default profile
#            tell current session of current window
#              write text "npm run dev"
#            end tell
#          end tell'
```

## kitty

### How It Works

Uses kitty's remote control protocol:

```bash
kitty @ launch --type=tab|os-window --title "Elsewhere" -- $SHELL -c "command; exec $SHELL"
```

### Capabilities

- ❌ Panes
- ✅ Tabs
- ✅ Windows

### Requirements

- `kitty` binary available in `$PATH`
- Remote control must be enabled (default in recent versions)
- `$KITTY_LISTEN_ON` set (for SSH scenarios)

### Configuration

In `~/.config/kitty/kitty.conf`:

```conf
# Enable remote control (usually default)
allow_remote_control yes

# Optional: Set listen socket for SSH
listen_on unix:/tmp/kitty-{kitty_pid}
```

### Known Issues

**SSH Support** - kitty remote control works over SSH if `$KITTY_LISTEN_ON` is set and forwarded properly.

### Example

```bash
elsewhere --tab -c "npm run dev"
# Creates: kitty @ launch --type=tab --title "Elsewhere" -- $SHELL -c "npm run dev; exec $SHELL"
```

## Ghostty

### How It Works

**⚠️ EXPERIMENTAL** - Uses macOS System Events for keyboard automation:

```applescript
tell application "Ghostty" to activate
delay 0.2
tell application "System Events"
  keystroke "t" using command down  # Cmd+T for new tab
end tell
delay 0.1
tell application "System Events"
  keystroke "command text here"
  key code 36  # Enter key
end tell
```

### Capabilities

- ❌ Panes
- ✅ Tabs
- ✅ Windows

### Requirements

- macOS only
- Ghostty must be installed
- **Accessibility permissions required** for System Events

### Granting Permissions

1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Add your terminal emulator (Terminal.app, iTerm2, etc.)
3. Toggle it on

### Known Issues

**No public scripting API** - Ghostty currently lacks official automation APIs. This implementation uses System Events as a workaround until Ghostty provides scriptability support.

**Tracking:** https://github.com/ghostty-org/ghostty/discussions/2353

**Reliability** - System Events automation is less reliable than AppleScript:
- Requires Accessibility permissions
- Can fail if Ghostty loses focus
- Delays needed for UI responsiveness

### Implementation Details

- Detects if Ghostty is currently running
- If running: sends `Cmd+T` (tab) or `Cmd+N` (window) before typing command
- If not running: launches Ghostty and types command in the window that opens

### Examples

```bash
# Tab (in running Ghostty)
elsewhere --tab -c "npm run dev"
# Simulates: Cmd+T, types "npm run dev", presses Enter

# Window
elsewhere --window -c "npm run dev"
# Simulates: Cmd+N, types "npm run dev", presses Enter
```

## Warp

### How It Works

**⚠️ EXPERIMENTAL** - Uses macOS System Events for keyboard automation (same as Ghostty).

### Capabilities

- ❌ Panes
- ✅ Tabs
- ✅ Windows

### Requirements

- macOS only
- Warp must be installed
- **Accessibility permissions required** for System Events

### Known Issues

Same as Ghostty - no public scripting API, uses System Events workaround.

### Implementation Details

- Detects if Warp is currently running
- If running: sends `Cmd+T` (tab) or `Cmd+N` (window) before typing command
- If not running: launches Warp and types command in the window that opens

### Examples

```bash
# Tab (in running Warp)
elsewhere --tab -c "npm run dev"
# Simulates: Cmd+T, types "npm run dev", presses Enter

# Window
elsewhere --window -c "npm run dev"
# Simulates: Cmd+N, types "npm run dev", presses Enter
```

## Backend Priority

When auto-selecting (no `--terminal` specified):

1. **Current multiplexer** (tmux/zellij) - If you're in one
2. **SSH guard** - Only multiplexers allowed in SSH
3. **Current terminal** - If detected and supported
4. **System backends** - Terminal.app → kitty → iTerm2 → Ghostty → Warp

Terminal.app is prioritized for reliability (no permissions, always works).
