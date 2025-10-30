## [0.2.3](https://github.com/mikegreiling/run-elsewhere/compare/v0.2.2...v0.2.3) (2025-10-30)


### Bug Fixes

* use zellij write-chars for tmux-like command execution ([c2cb9fc](https://github.com/mikegreiling/run-elsewhere/commit/c2cb9fc6ff114906ccaed747ea9ef00101e79f84))

## [0.2.2](https://github.com/mikegreiling/run-elsewhere/compare/v0.2.1...v0.2.2) (2025-10-30)


### Bug Fixes

* add macOS check to AppleScript wrapper ([f668194](https://github.com/mikegreiling/run-elsewhere/commit/f66819485772d10a050bbd5ba037dae90e03f0cf))

## [0.2.1](https://github.com/mikegreiling/run-elsewhere/compare/v0.2.0...v0.2.1) (2025-10-30)


### Bug Fixes

* prevent AppleScript permission prompts in remote sessions ([77290af](https://github.com/mikegreiling/run-elsewhere/commit/77290afb685d00be7e1a3ba29aca6f325bd88742))

# [0.2.0](https://github.com/mikegreiling/run-elsewhere/compare/v0.1.0...v0.2.0) (2025-10-30)


### Bug Fixes

* support all four split directions (left, right, up, down) ([ff859fe](https://github.com/mikegreiling/run-elsewhere/commit/ff859feb4221a44f14c11986759e582c18ca5df3))
* use AppleScript to detect Terminal.app location ([49bc47c](https://github.com/mikegreiling/run-elsewhere/commit/49bc47c6798c75bc780147a632aa0161f3371e34))


### Features

* add zellij terminal multiplexer support ([16ba904](https://github.com/mikegreiling/run-elsewhere/commit/16ba9040e83288206f72cdbb5c48b8090c077ba9))

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
