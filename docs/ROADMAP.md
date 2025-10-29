# Roadmap

## Phase 1 (Current)

✅ **Complete**

Minimal viable product with:
- tmux pane splitting
- Terminal.app window creation
- Environment detection (SSH, tmux, macOS)
- CLI with argument parsing
- Exit codes (0, 1, 64, 70, 73, 75)
- --dry-run mode with JSON output
- Unit tests
- Documentation

**Supported terminals:**
- tmux (split pane only)
- Terminal.app (new window)

## Phase 2 (Planned)

### Additional Terminal Backends

- **iTerm2** - Tab and window support (with AppleScript/Python integration)
- **kitty** - Window/tab support (remote control protocol)
- **zellij** - Pane/window support (CLI interface)
- **Ghostty** - Support via CLI or AppleScript
- **Warp** - Terminal support (TBD)

### Core Features

- `--tab` support for all applicable terminals
- `-i, --interactive` mode for prompting when multiple options available
- Better error messages with recovery suggestions
- Config file support (~/.elsewhere/config.json or similar)
- Aliases for common commands

### Robustness

- Proper signal handling (SIGTERM, SIGINT)
- Session persistence checking
- Better timeout handling
- Integration tests for each terminal backend
- CI/CD pipeline for automated testing

### Nice-to-haves

- Shell completion (bash, zsh, fish)
- Logging/debugging mode
- Support for environment variable expansion
- Window/pane naming
- Hook system for custom terminal setup

## Architecture for Phase 2

### Terminal Abstraction

Current structure for Phase 1:
```
run/
  tmux.ts         # tmux implementation
  macos/
    terminal.ts   # Terminal.app implementation
```

Phase 2 structure (proposed):
```
run/
  runner.ts           # Base interface/abstract class
  tmux.ts             # tmux runner
  applescript.ts      # Base for AppleScript-based terminals
  macos/
    terminal.ts       # Terminal.app
    iterm2.ts         # iTerm2
    ghostty.ts        # Ghostty
  python/
    iterm2_python.ts  # iTerm2 Python bridge (for more advanced features)
  cli/
    kitty.ts          # kitty
    zellij.ts         # zellij
```

### Terminal Detection

Phase 2 will add detection for:
- iTerm2 (check `ITERM_SESSION_ID` env var, look for app bundle)
- kitty (check `KITTY_WINDOW_ID`, `KITTY_LISTEN_ON`)
- zellij (check `ZELLIJ`, look for `zellij` binary)
- Ghostty (check `GHOSTTY_RESOURCES_DIR`)
- Warp (check environment or bundle)

### Environment-aware defaults

- SSH + only iTerm2 available → use iTerm2 (can work remotely)
- SSH + only kitty available → use kitty if KITTY_LISTEN_ON is set
- SSH + only zellij available → use zellij
- Local + multiple options → offer choice or use config preference

## Technical Debt & Improvements

- [ ] Better type safety for shell escaping
- [ ] Utility functions for common terminal operations
- [ ] Mocking framework for reliable integration tests
- [ ] Logging framework for debugging terminal operations
- [ ] Performance profiling for command startup time

## Open Questions

1. Should Phase 2 support switching between terminals with a preference system?
2. How should we handle nested terminal scenarios (e.g., tmux inside SSH inside iTerm2)?
3. Should we support custom terminal backend plugins?
4. How to handle terminal-specific features gracefully (some terminals don't support tabs)?
