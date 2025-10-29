# run-elsewhere

A Node/TypeScript CLI utility for running commands in new terminal contexts. Split a tmux pane, open a Terminal.app window, or auto-detect the best option.

## Installation

### Global Install

```bash
npm install -g run-elsewhere
```

### Use without installing

```bash
npx -y run-elsewhere -c "your command here"
```

## Quick Start

### Basic usage

```bash
# Run command in new tmux pane to the right (default)
elsewhere -c "npm run dev"

# Run in new pane to the left
elsewhere --left -c "npm run dev"

# Run in new Terminal.app window
elsewhere --terminal=Terminal -c "npm run dev"

# Pipe a command
echo "npm run test" | elsewhere -p

# Use -- syntax
elsewhere -- npm run build
```

### --dry-run mode

See what would be executed without actually running it:

```bash
elsewhere --dry-run -c "echo hello"
```

Output:
```json
{
  "type": "tmux",
  "command": "echo hello",
  "direction": "h"
}
```

## CLI Reference

### Flags

- `--terminal=NAME` - Force a specific terminal: `tmux` or `Terminal` (Phase 1 only)
- `-p, --pane` - Require pane mode (tmux only)
- `-w, --window` - Create new window (default for Terminal)
- `-u, --up` - Split upward (tmux)
- `-d, --down` - Split downward (tmux)
- `-l, --left` - Split left (tmux, horizontal)
- `-r, --right` - Split right (tmux, horizontal, default)
- `-c, --command "CMD"` - Command to run
- `--dry-run` - Print execution plan as JSON and exit
- `-y, --yes, --no-tty` - Non-interactive mode (Phase 1 is always non-interactive)
- `-h, --help` - Show help
- `-v, --version` - Show version

### Command source precedence

The utility resolves the command to run in this order:

1. `-c "..."` flag (highest priority)
2. Arguments after `--`
3. Piped stdin (lowest priority)

### Exit codes

- `0` - Success
- `1` - Generic failure
- `64` - Usage error (bad flags, no command)
- `70` - Software/OS error (backend not available)
- `73` - SSH without tmux (GUI Terminal not feasible)
- `75` - No supported terminal available

## How it works

### Environment detection

The utility automatically detects:

- Whether you're inside a tmux session
- Whether you're connected via SSH
- Your OS (macOS, Linux, etc.)
- Available terminal applications

### Decision tree (Phase 1)

1. **SSH/headless guard**
   - If SSH detected and inside tmux → use tmux pane
   - If SSH detected and NOT in tmux → error (can't open GUI Terminal)

2. **Forced backend** (`--terminal=`)
   - `tmux`: Must be in tmux session, error if not
   - `Terminal`: macOS only, error if not available

3. **Auto path** (no `--terminal` specified)
   - Try tmux if available
   - Fall back to Terminal.app on macOS
   - Error if nothing available

## Testing

### Unit tests

```bash
npm test
```

### Manual integration testing with tmux

```bash
# Start a tmux session
tmux new-session -d -s test

# Run a command in that session
tmux send-keys -t test "cd /path/to/run-elsewhere" Enter
tmux send-keys -t test "elsewhere -c 'echo hello from elsewhere'" Enter

# Check that the pane split happened
tmux list-panes -t test

# Kill the test session
tmux kill-session -t test
```

### Manual integration testing with Terminal.app

```bash
# On macOS, run the CLI to open a new Terminal window
elsewhere -c "echo 'Hello from Terminal.app'"

# A new Terminal window should open and execute the command
```

## Phase 1 Limitations

- **Terminal backends**: Only tmux and Terminal.app supported
  - Phase 2 will add: iTerm2, kitty, zellij, Ghostty, Warp
- **Tab mode**: `--tab` is not yet supported (Phase 2)
- **Interactive mode**: `-i/--interactive` is a stub (Phase 2)

See [ROADMAP.md](docs/ROADMAP.md) for Phase 2 plans.

## Development

See [DEV.md](docs/DEV.md) for local development instructions.

## License

MIT
