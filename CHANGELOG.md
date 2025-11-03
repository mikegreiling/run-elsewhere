## [0.5.5](https://github.com/mikegreiling/run-elsewhere/compare/v0.5.4...v0.5.5) (2025-11-03)


### Bug Fixes

* prevent Terminal.app from launching during environment detection ([bc04e4b](https://github.com/mikegreiling/run-elsewhere/commit/bc04e4b9e7b37b50cdf804f559ea403768dea143))

## [0.5.4](https://github.com/mikegreiling/run-elsewhere/compare/v0.5.3...v0.5.4) (2025-11-03)


### Bug Fixes

* surface --no-tty option in help menu with description ([abdabc4](https://github.com/mikegreiling/run-elsewhere/commit/abdabc46d904570ebc293474728dd43f01585110))

## [0.5.3](https://github.com/mikegreiling/run-elsewhere/compare/v0.5.2...v0.5.3) (2025-11-03)


### Bug Fixes

* hide --tty option from help menu ([c30a958](https://github.com/mikegreiling/run-elsewhere/commit/c30a958ed76afd5295a1278717cf7b25d8dcf6a2))

## [0.5.2](https://github.com/mikegreiling/run-elsewhere/compare/v0.5.1...v0.5.2) (2025-11-03)


### Bug Fixes

* resolve --no-tty parsing by adding complementary --tty option ([c0796d7](https://github.com/mikegreiling/run-elsewhere/commit/c0796d76e99eb30da744e164a851c9aa712437f1))

## [0.5.1](https://github.com/mikegreiling/run-elsewhere/compare/v0.5.0...v0.5.1) (2025-11-03)


### Bug Fixes

* resolve --no-tty parsing conflict with --no option ([719108e](https://github.com/mikegreiling/run-elsewhere/commit/719108e1499083f1db438dcc795c0acec770a12b))

# [0.5.0](https://github.com/mikegreiling/run-elsewhere/compare/v0.4.1...v0.5.0) (2025-11-03)


### Features

* add --verbose flag for debugging process tree detection ([a4f9fba](https://github.com/mikegreiling/run-elsewhere/commit/a4f9fba9bb3e8b0599881bae23a8ca866e668826))

## [0.4.1](https://github.com/mikegreiling/run-elsewhere/compare/v0.4.0...v0.4.1) (2025-11-03)


### Bug Fixes

* implement process tree walking for GUI terminal detection in multiplexers ([cef8f6f](https://github.com/mikegreiling/run-elsewhere/commit/cef8f6facde76f6aa26bbe45481b545be55cb9e2))

# [0.4.0](https://github.com/mikegreiling/run-elsewhere/compare/v0.3.4...v0.4.0) (2025-11-03)


### Bug Fixes

* prefix unused error variables with underscore ([69c72cc](https://github.com/mikegreiling/run-elsewhere/commit/69c72cc75fdc6011e810f1e931b2db17376dba87))


### Features

* implement window delegation for tmux and zellij ([55a8c41](https://github.com/mikegreiling/run-elsewhere/commit/55a8c418089e6253874b935fc5f452c8e12b3f45))

## [0.3.4](https://github.com/mikegreiling/run-elsewhere/compare/v0.3.3...v0.3.4) (2025-11-03)


### Bug Fixes

* clear interactive flag after menu selection ([90d2bb3](https://github.com/mikegreiling/run-elsewhere/commit/90d2bb32a3ad90f1ee7c1af30413672e7f210283))

## [0.3.3](https://github.com/mikegreiling/run-elsewhere/compare/v0.3.2...v0.3.3) (2025-11-03)


### Bug Fixes

* interactive menu selection lookup using display name mapping ([ceb414c](https://github.com/mikegreiling/run-elsewhere/commit/ceb414cf42b0c28466c940955b1c2691d70c0f13))

## [0.3.2](https://github.com/mikegreiling/run-elsewhere/compare/v0.3.1...v0.3.2) (2025-11-03)


### Bug Fixes

* remove Terminal.app tab support due to AppleScript limitations ([1090f34](https://github.com/mikegreiling/run-elsewhere/commit/1090f3419a113b6aa5b1ebf713788b08f707b2f2))

## [0.3.1](https://github.com/mikegreiling/run-elsewhere/compare/v0.3.0...v0.3.1) (2025-11-03)


### Bug Fixes

* implement bug fixes for multiplexer and terminal backends ([ca51061](https://github.com/mikegreiling/run-elsewhere/commit/ca51061bf1486d54c9fb6ee84c7417bca8b22145))

# [0.3.0](https://github.com/mikegreiling/run-elsewhere/compare/v0.2.3...v0.3.0) (2025-11-01)


### Bug Fixes

* resolve all ESLint errors and update version handling ([8176fc2](https://github.com/mikegreiling/run-elsewhere/commit/8176fc23ac9cc12070b29156b07c3e48aa743f6a))


### Features

* add Phase 2a foundation - terminal detection and backend abstraction ([8ef0e6c](https://github.com/mikegreiling/run-elsewhere/commit/8ef0e6cfe4f4c789642b09f8a72587b1816c4b2a))
* implement interactive backend selection menu (Phase 2d) ([75606cd](https://github.com/mikegreiling/run-elsewhere/commit/75606cd1e725678c27af7db5d590605cd9b0e6dc))
* implement multi-stage planner with target resolution (Phase 2c) ([7d9b566](https://github.com/mikegreiling/run-elsewhere/commit/7d9b5667af2d0028fd4f16f665b76b844f6a5da0))

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
