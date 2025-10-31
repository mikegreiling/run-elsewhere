# Roadmap

## Phase 1 ✅ COMPLETE

Minimal viable product with core functionality.

**Delivered:**
- tmux pane splitting (all 4 directions)
- Terminal.app window creation
- Environment detection (SSH, tmux, macOS)
- CLI with argument parsing
- Exit codes (0, 1, 64, 70, 73, 75)
- --dry-run mode with JSON output
- Unit tests (49 tests)
- Documentation

**Supported terminals:**
- tmux (pane splitting)
- Terminal.app (new windows)

## Phase 2 ✅ COMPLETE

Expanded backend support with interactive selection and target types.

**Delivered:**

### New Backends (5 added)
- ✅ **zellij** - Pane support with write-chars workflow
- ✅ **iTerm2** - Tab & window support via AppleScript
- ✅ **kitty** - Tab & window support via CLI remote control
- ✅ **Ghostty** - Tab & window support via System Events (experimental)
- ✅ **Warp** - Tab & window support via System Events (experimental)

### Features
- ✅ **Target types** - `--pane`, `--tab`, `--window` flags
- ✅ **Interactive mode** (`-i`) - Menu-based backend selection with enquirer
- ✅ **Auto-select mode** (`-y`) - Skip prompts, use first available
- ✅ **Target degradation** - Automatic fallback (pane→tab→window)
- ✅ **Strict mode** (`--no`) - Fail instead of degrading
- ✅ **Terminal detection** - Auto-detect current terminal via $TERM_PROGRAM
- ✅ **Enhanced --dry-run** - Human-readable output + exact commands
- ✅ **Backend abstraction** - Polymorphic interface for all backends
- ✅ **6-stage planner** - Sophisticated backend selection pipeline
- ✅ **170 unit tests** - Comprehensive test coverage

### Architecture
- ✅ Backend interface with capability declarations
- ✅ Multi-stage planner (validate → detect → filter → select → resolve → execute)
- ✅ Target resolution system with degradation rules
- ✅ Terminal detection (multi-method: env vars, parent process)
- ✅ Comprehensive documentation (ARCHITECTURE, BACKENDS, TROUBLESHOOTING)

## Phase 3 (Future)

### Linux Support

Add support for Linux terminal emulators:
- **wezterm** - Cross-platform, tab/pane support
- **gnome-terminal** - Tab support via `gnome-terminal --tab`
- **konsole** - KDE terminal with tab support
- **xterm** - Classic X11 terminal
- **alacritty** - Detect but route to multiplexer (no tabs/windows API)

### Windows Support

- **Windows Terminal** - Tab support via `wt.exe` CLI
- **ConEmu** - Tab support if detectable
- **PowerShell** - New window support

### Enhanced Features

- **Config file** - `~/.elsewhere/config.json` for:
  - Default backend preference
  - Per-directory overrides
  - Custom backend aliases
- **Shell completion** - bash, zsh, fish
- **Logging/debug mode** - `--debug` flag for troubleshooting
- **Session naming** - Name panes/tabs/windows: `--name "API Server"`
- **Working directory** - `--cwd /path` to set starting directory
- **Environment variables** - `--env KEY=VALUE` to pass to new context

### GUI Terminal Pane Support

- **iTerm2 panes** - AppleScript-based split pane support
- **kitty panes** - Layout system via `kitty @ launch --location=hsplit`
- **wezterm panes** - Native split pane support

### Advanced Features

- **Plugin system** - Custom backend implementations
- **Homebrew tap** - `brew install elsewhere`
- **nix/asdf plugins** - Additional package managers
- **Command history** - Remember recent commands for quick re-run
- **Session management** - List, attach, kill elsewhere-created contexts

## Technical Debt

### Priority 1 (Address Soon)
- None currently - Phase 2 refactoring addressed architectural concerns

### Priority 2 (Nice to Have)
- Extract shared escape utilities to `src/utils/escape.ts`
- Consider deprecating legacy exports (runInTmuxPane, runInZellijPane)
- Populate Plan.alternatives field (or remove it)

### Priority 3 (Future)
- Integration tests with real terminals (requires GUI environment)
- Performance profiling for large command strings
- Support for custom AppleScript snippets per backend

## Contributing

Interested in helping with Phase 3 features? See [DEV.md](DEV.md) for development setup.

### High-Impact Contributions

- **Linux backend implementations** - wezterm, gnome-terminal
- **Windows Terminal support** - wt.exe integration
- **Shell completion** - bash/zsh/fish autocompletion
- **Config file support** - User preferences system
- **Integration tests** - Automated GUI testing setup
