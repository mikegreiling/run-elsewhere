# run-elsewhere

A TypeScript CLI utility for running commands in new terminal contexts. Automatically detects your environment and chooses the best backend—or let you pick interactively.

**Supported backends:**
Terminal multiplexers: **tmux** • **zellij**
macOS terminals: **Terminal.app** • **iTerm2** • **kitty** • **Ghostty** • **Warp**

## Installation

### Global Install

```bash
npm install -g run-elsewhere
# or
pnpm add -g run-elsewhere
```

### Use without installing

```bash
npx -y run-elsewhere -c "your command here"
```

## Quick Start

### Automatic backend selection

The CLI automatically selects the best terminal backend based on your environment:

```bash
# If in tmux → creates new pane
# If in zellij → creates new pane
# Otherwise → opens new window in your current terminal (or Terminal.app)
elsewhere -c "npm run dev"
```

### Split directions (tmux/zellij)

```bash
elsewhere -c "npm run dev"              # right (default)
elsewhere --left -c "npm run dev"       # left
elsewhere --up -c "npm run dev"         # up
elsewhere --down -c "npm run dev"       # down
```

### Force specific backend

```bash
elsewhere --terminal=tmux -c "htop"
elsewhere --terminal=iTerm2 -c "npm run dev"
elsewhere --terminal=kitty -c "npm run test"
```

### Target types

```bash
elsewhere --pane -c "npm run dev"       # pane (tmux/zellij)
elsewhere --tab -c "npm run dev"        # tab (iTerm2, kitty, Ghostty, Warp)
elsewhere --window -c "npm run dev"     # window (all terminals)
```

### Interactive mode

Let the CLI show you all available backends:

```bash
elsewhere -i -c "npm run dev"
# Shows menu:
# > Terminal.app (window)
#   iTerm2 (tab/window)
#   kitty (tab/window)
```

### Auto-select mode

Skip interactive prompts and use first available:

```bash
elsewhere -y -c "npm run dev"
```

### Command input methods

```bash
# Method 1: -c flag (recommended)
elsewhere -c "npm run dev"

# Method 2: -- syntax
elsewhere -- npm run dev

# Method 3: stdin pipe
echo "npm run test" | elsewhere
```

### Dry-run mode

See what would be executed without running it:

```bash
elsewhere --dry-run -c "echo hello"
```

Output:
```
Backend: tmux
Target: pane
Direction: right

Exact command:
tmux split-window -h && tmux send-keys "echo hello" Enter

Full plan:
{
  "type": "tmux",
  "command": "echo hello",
  "direction": "right",
  "target": "pane",
  "exactCommand": "tmux split-window -h && tmux send-keys \"echo hello\" Enter"
}
```

## Backends

### Terminal Multiplexers

| Backend | Supports | Notes |
|---------|----------|-------|
| **tmux** | pane | Requires active tmux session. All 4 split directions. |
| **zellij** | pane | Requires active zellij session. All 4 split directions. |

### macOS GUI Terminals

| Backend | Supports | Notes |
|---------|----------|-------|
| **Terminal.app** | window | Native macOS terminal. Most reliable. |
| **iTerm2** | tab, window | AppleScript-based. Pane support planned for future. |
| **kitty** | tab, window | CLI-based via remote control protocol. |
| **Ghostty** | tab, window | **Experimental.** Uses System Events (requires Accessibility permissions). |
| **Warp** | tab, window | **Experimental.** Uses System Events (requires Accessibility permissions). |

## How it Works

### Automatic Backend Selection

When you run `elsewhere` without `--terminal`, it follows this priority:

1. **If in multiplexer** → Use that multiplexer (tmux or zellij)
2. **If multiplexer detected + SSH** → Use multiplexer only (GUI blocked)
3. **If current terminal detected** → Use current terminal if supported
4. **Otherwise** → Use first available: Terminal.app → kitty → iTerm2 → Ghostty → Warp

### Target Degradation

If you request a target type that a backend doesn't support, it automatically degrades:

```bash
# You request: --tab with Terminal.app
# Result: Degrades to --window (with warning)

# You request: --pane with iTerm2
# Result: Degrades to --tab (with warning)
```

Use `--no` flag to prevent degradation (fails instead):

```bash
elsewhere --tab --no --terminal=Terminal -c "npm run dev"
# Error: Terminal.app does not support tab targets
```

### SSH Session Handling

When connected via SSH:

- ✅ **tmux/zellij work** (if you're in a session)
- ❌ **GUI terminals blocked** (can't open windows remotely)

```bash
# In SSH + tmux → works
elsewhere -c "htop"

# In SSH without multiplexer → error
elsewhere -c "htop"
# Error: SSH detected and not inside multiplexer; cannot open GUI Terminal
```

## CLI Reference

### Options

| Flag | Description |
|------|-------------|
| `--terminal=NAME` | Force backend: tmux, zellij, Terminal, iTerm2, kitty, Ghostty, Warp |
| `-p, --pane` | Create in pane (tmux/zellij) |
| `-t, --tab` | Create in tab (iTerm2, kitty, Ghostty, Warp) |
| `-w, --window` | Create in window (all terminals) |
| `-u, --up` | Split direction: up |
| `-d, --down` | Split direction: down |
| `-l, --left` | Split direction: left |
| `-r, --right` | Split direction: right (default) |
| `-i, --interactive` | Show interactive backend picker |
| `-y, --yes, --no-tty` | Auto-select first available backend |
| `--no` | Strict mode: fail if exact target unavailable |
| `-c, --command "CMD"` | Command to run |
| `--dry-run` | Print execution plan and exit |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

### Command Precedence

1. `-c "..."` flag (highest priority)
2. Arguments after `--`
3. Piped stdin (lowest priority)

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Generic failure |
| `64` | Usage error (bad flags, no command) |
| `70` | Software/OS error (backend not available) |
| `73` | SSH without multiplexer (GUI Terminal not feasible) |
| `75` | No supported terminal available |

## Examples

### Development Workflows

```bash
# Start dev server in new pane
elsewhere -c "npm run dev"

# Watch tests in pane to the left
elsewhere --left -c "npm run test:watch"

# Start multiple services
elsewhere --up -c "npm run api" && \
elsewhere --down -c "npm run worker"
```

### SSH Development

```bash
# Must be in tmux or zellij
ssh user@server
tmux new-session

# Now you can split panes
elsewhere -c "npm run dev"
elsewhere --left -c "tail -f logs/app.log"
```

### Interactive Selection

```bash
# Let me pick which terminal to use
elsewhere -i -c "npm run dev"

# Shows:
# ? Select terminal backend:
#   ❯ Terminal.app (window) [detected]
#     iTerm2 (tab/window)
#     kitty (tab/window)
#     Ghostty (tab/window) [experimental]
#     Warp (tab/window) [experimental]
```

## Troubleshooting

### Ghostty/Warp: Permission Denied

Ghostty and Warp require **Accessibility permissions** because they use System Events for automation.

**Fix:**
1. Open System Settings → Privacy & Security → Accessibility
2. Add your terminal application (e.g., Terminal.app, iTerm2)
3. Try again

### Terminal Not Detected

If your terminal isn't auto-detected, force it explicitly:

```bash
elsewhere --terminal=iTerm2 -c "npm run dev"
```

### SSH: GUI Terminal Error

GUI terminals don't work over SSH. Use tmux or zellij:

```bash
# Start tmux first
tmux new-session

# Now elsewhere works
elsewhere -c "npm run dev"
```

### Target Degradation Warning

If you see warnings about target degradation:

```bash
⚠ Terminal.app does not support tabs; degrading to window
```

Either:
- Accept the degradation (works fine)
- Use `--no` flag to fail instead: `elsewhere --tab --no -c "..."`
- Switch to a backend that supports tabs: `elsewhere --terminal=iTerm2 --tab -c "..."`

## Development

See [DEV.md](docs/DEV.md) for local development and contribution guidelines.

### Related Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and internals
- [BACKENDS.md](docs/BACKENDS.md) - Backend-specific details and limitations
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [ROADMAP.md](docs/ROADMAP.md) - Future plans and enhancements

## License

MIT
