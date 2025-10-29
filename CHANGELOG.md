# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-10-28

### Added

- Initial Phase 1 implementation
- tmux pane splitting with configurable direction (left, right, up, down)
- Terminal.app window creation on macOS
- Environment detection (SSH, tmux, platform)
- Full CLI with argument parsing (yargs)
- Command source precedence: `-c` > `--` args > stdin
- Exit codes: 0, 1, 64, 70, 73, 75
- `--dry-run` mode with JSON output
- Unit tests (29 tests covering all core logic)
- Strict TypeScript configuration with `noUncheckedIndexedAccess`
- Type-aware ESLint rules
- pnpm package manager enforcement
- Semantic versioning and automated releases via GitHub Actions

### Phase 1 Limitations

- Terminal backends: tmux and Terminal.app only (Phase 2: iTerm2, kitty, zellij, Ghostty, Warp)
- Tab mode not implemented (`--tab` is stubbed)
- Interactive mode stubbed (`--interactive` for Phase 2)
