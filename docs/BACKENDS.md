# Backend Details

Comprehensive reference for all supported terminal backends.

## Backend Comparison

| Backend | Type | Supports | Experimental | Permissions |
|---------|------|----------|--------------|-------------|
| **tmux** | Multiplexer | pane | No | None |
| **zellij** | Multiplexer | pane | No | None |
| **Terminal.app** | macOS GUI | window | No | None |
| **iTerm2** | macOS GUI | tab, window | No | None |
| **kitty** | Cross-platform GUI | tab, window | No | None |
| **Ghostty** | macOS GUI | tab, window | Yes | Accessibility |
| **Warp** | macOS GUI | tab, window | Yes | Accessibility |

## tmux

### How It Works

Uses tmux's native commands:
1. `tmux split-window -h/-v [-b]` - Creates new pane
2. `tmux send-keys "command" Enter` - Executes command

### Capabilities

- ✅ Panes (all 4 directions: left, right, up, down)
- ❌ Tabs (tmux has "windows" but they're different from GUI tabs)
- ❌ GUI windows

### Requirements

- Must be inside an active tmux session (`$TMUX` set)
- `tmux` binary available in `$PATH`

### Known Issues

None.

### Example

```bash
elsewhere -c "npm run dev"
# Creates: tmux split-window -h && tmux send-keys "npm run dev" Enter
```

## zellij

### How It Works

Uses zellij's action commands:
1. `zellij action new-pane --direction` - Creates new pane
2. `zellij action write-chars "command"` - Types command
3. `zellij action write 13` - Presses Enter (ASCII 13)

### Capabilities

- ✅ Panes (all 4 directions: left, right, up, down)
- ❌ Tabs
- ❌ GUI windows

### Requirements

- Must be inside an active zellij session (`$ZELLIJ` set)
- `zellij` binary available in `$PATH`

### Known Issues

**Direction bug** - The `--direction` flag doesn't work correctly in zellij:
- up/down always opens below
- left/right always opens after

This is a zellij issue, not a run-elsewhere bug.

**Tracking:** https://github.com/zellij-org/zellij/issues/3332

### Example

```bash
elsewhere -c "npm run dev"
# Creates: zellij action new-pane --direction "Right"
#         zellij action write-chars "npm run dev"
#         zellij action write 13
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
- ❌ Tabs (Terminal.app tabs aren't scriptable via `do script`)
- ✅ Windows

### Requirements

- macOS only
- Terminal.app must be available (always present on macOS)

### Known Issues

None. Most reliable backend.

### Example

```bash
elsewhere -c "npm run dev"
# Creates: osascript -e 'tell application "Terminal"
#            activate
#            do script "npm run dev"
#          end tell'
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

### Example

```bash
elsewhere --tab -c "npm run dev"
# Simulates: Cmd+T, types "npm run dev", presses Enter
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

### Example

```bash
elsewhere --tab -c "npm run dev"
# Simulates: Cmd+T, types "npm run dev", presses Enter
```

## Backend Priority

When auto-selecting (no `--terminal` specified):

1. **Current multiplexer** (tmux/zellij) - If you're in one
2. **SSH guard** - Only multiplexers allowed in SSH
3. **Current terminal** - If detected and supported
4. **System backends** - Terminal.app → kitty → iTerm2 → Ghostty → Warp

Terminal.app is prioritized for reliability (no permissions, always works).
