# `cld` Command - Complete API Specification & Implementation Guide

**Version:** 2.0
**Date:** 2025-11-03
**Status:** Design Document

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Command API Reference](#command-api-reference)
4. [Session ID Expansion Algorithm](#session-id-expansion-algorithm)
5. [Tmux Integration](#tmux-integration)
6. [Claude Code Detection](#claude-code-detection)
7. [Error Handling](#error-handling)
8. [Implementation Details](#implementation-details)
9. [Migration from v1](#migration-from-v1)
10. [Future TypeScript Package](#future-typescript-package)
11. [Examples](#examples)

---

## Overview

`cld` is a convenience wrapper around the `claude` CLI that provides:
- Simplified command invocation
- Intelligent session ID expansion (partial → full UUID)
- Tmux integration for automatic session tracking
- Multi-pane/window/tab session forking via `run-elsewhere`
- Safety checks to prevent nested Claude Code execution

### Key Features

- **Session ID Expansion**: Type only the first 8+ characters of a session UUID
- **Tmux Metadata Integration**: Automatically infer session IDs from tmux pane metadata
- **Spatial Navigation**: Fork sessions into new panes using directional commands
- **Safety First**: Prevents accidentally running Claude inside Claude Code
- **MCP Auto-Detection**: Relies on Claude's built-in MCP config discovery

---

## Design Philosophy

1. **Progressive Disclosure**: Simple commands (`cld`) work as expected; advanced features available when needed
2. **Context Awareness**: Leverages tmux metadata and environment for intelligent defaults
3. **Fail Fast**: Clear error messages when operations cannot proceed
4. **Zero Config**: Works out of the box with sensible defaults
5. **Future-Proof**: Bash implementation serves as specification for TypeScript port

---

## Command API Reference

### Basic Invocation

```bash
cld [OPTIONS]
```

**Behavior**: Direct passthrough to `claude` with all arguments preserved.

**Example**:
```bash
cld --help
cld "explain this code"
cld --model opus
```

---

### Resume Session with Expansion

```bash
cld resume <partial-session-id>
```

**Description**: Resumes a Claude session by expanding a partial session ID to its full UUID.

**Parameters**:
- `<partial-session-id>`: Minimum 8 hexadecimal characters from start of session UUID

**Behavior**:
1. Validates input is 8+ hex characters
2. Searches for matching session UUIDs in:
   - `~/.claude/projects/*/transcripts/*.jsonl` (primary)
   - `~/.claude/todos/*.json` (fallback)
3. Ignores agent sessions (containing `-agent-`)
4. If unique match found: executes `claude --resume <full-uuid>`
5. If multiple matches: displays list and requests longer substring
6. If no matches: exits with error

**Example**:
```bash
cld resume 22e10eeb
# Expands to: claude --resume 22e10eeb-494e-4ffb-969c-04ba272379b4
```

**Exit Codes**:
- `0`: Session resumed successfully
- `1`: Invalid input format
- `2`: No matching sessions found
- `3`: Multiple ambiguous matches found

---

### Resume Session from Tmux Metadata

```bash
cld resume
```

**Description**: Resumes the Claude session associated with the current tmux pane.

**Behavior**:
1. Checks if running in tmux context (`$TMUX` environment variable)
2. Reads `@meta.claude.session_id` from current pane's user options
3. If session ID exists: executes `claude --resume <session-id>`
4. If not in tmux or no session ID: exits with error

**Example**:
```bash
# In a tmux pane where Claude previously ran
cld resume
# Resumes the last Claude session from this pane
```

**Exit Codes**:
- `0`: Session resumed successfully
- `4`: Not running in tmux context
- `5`: No session ID found in tmux metadata

---

### Fork Session with Expansion

```bash
cld fork <partial-session-id>
```

**Description**: Creates a new forked session based on an existing session's history.

**Parameters**:
- `<partial-session-id>`: Minimum 8 hexadecimal characters from start of session UUID

**Behavior**:
1. Expands partial session ID (same algorithm as `cld resume`)
2. Executes `claude --resume <full-uuid> --fork-session`
3. Creates new session with forked history

**Example**:
```bash
cld fork a4f9fba8
# Expands to: claude --resume a4f9fba8-7c3e-4d1f-8a2b-9e5f6c7d8e9f --fork-session
```

**Exit Codes**: Same as `cld resume <partial-session-id>`

---

### Fork Session from Tmux Metadata

```bash
cld fork
```

**Description**: Forks the Claude session associated with the current tmux pane.

**Behavior**:
1. When **inside Claude Code** (`CLAUDECODE` env var set):
   - Infers `pane` as default target location
   - Executes `cld fork pane` (see next section)
2. When **not inside Claude Code**:
   - Reads `@meta.claude.session_id` from current pane
   - Executes `claude --resume <session-id> --fork-session` in current terminal

**Example**:
```bash
# In a tmux pane where Claude previously ran
cld fork
# Forks the session in the same pane (or new pane if inside Claude Code)
```

**Exit Codes**:
- `0`: Session forked successfully
- `4`: Not running in tmux context
- `5`: No session ID found in tmux metadata

---

### Fork Session to New Location

```bash
cld fork <location> [<partial-session-id>]
```

**Description**: Forks a Claude session into a new tmux pane, window, or tab using `run-elsewhere`.

**Parameters**:
- `<location>`: One of `up`, `down`, `left`, `right`, `pane`, `tab`, `window`
- `<partial-session-id>`: (Optional) Partial session UUID; if omitted, uses tmux metadata

**Behavior**:
1. Determines session ID:
   - If `<partial-session-id>` provided: expands using standard algorithm
   - If omitted: reads from tmux metadata (`@meta.claude.session_id`)
2. Constructs command: `cd '<cwd>'; claude --resume <full-uuid> --fork-session`
3. Executes via `run-elsewhere`:
   ```bash
   npx -y run-elsewhere --no-tty --<location> -- <command>
   ```
4. The `--no-tty` flag prevents interactive menu when running inside Claude Code

**Location Options**:
- `up`: New pane above current pane
- `down`: New pane below current pane
- `left`: New pane to the left of current pane
- `right`: New pane to the right of current pane
- `pane`: New pane (default split direction)
- `tab`: New window (tab) in current session
- `window`: New detached window

**Example**:
```bash
# Fork with explicit session ID
cld fork up 22e10eeb

# Fork current pane's session to the right
cld fork right

# Fork into new window/tab
cld fork tab a4f9fba8
```

**Working Directory**: The new pane/window/tab will `cd` into the current working directory (`$PWD`) before launching Claude.

**Exit Codes**:
- `0`: Fork command executed successfully
- `1`: Invalid location specified
- `2`/`3`: Session ID expansion errors
- `4`/`5`: Tmux metadata errors (when session ID omitted)
- `6`: Not running in tmux context (required for elsewhere)

---

## Session ID Expansion Algorithm

This algorithm converts partial session UUIDs to full UUIDs using **prefix-only matching** to prevent accidental collisions.

### Input Validation

**Format Requirements**:
```bash
# Regex: ^[0-9a-f-]{6,}$
# At least 6 hexadecimal characters (excluding dashes)
# Dashes are optional and stripped before searching
```

**Valid Examples**:
- `23e30f` (6 chars, minimum)
- `23e30f82` (8 chars)
- `23e30f82-be` (with dash)
- `23e30f82-bee0-` (multiple dashes, trailing dash)
- `23e30f82bee0` (equivalent to above, dashes optional)
- `23e30f82-bee0-4861` (longer prefix)
- `23e30f82-bee0-4861-8bd3-869ca8a5c8a3` (full UUID)

**Invalid Examples**:
- `23e3` (too short, < 6 hex chars)
- `23E30F` (uppercase not allowed)
- `xyz123` (non-hex characters)
- `---` (only dashes, no hex chars)

### Dash Handling

**Key Feature**: Dashes are completely optional in input and are stripped before searching.

**Examples**:
- Input: `23e30f82-bee0` → Search for: `23e30f82bee0*`
- Input: `23e30f82bee0` → Search for: `23e30f82bee0*` (identical)
- Input: `23e30f82-bee0-4861` → Search for: `23e30f82bee04861*`

This allows maximum flexibility - users can copy/paste partial UUIDs with or without dashes.

### Prefix-Only Matching

**CRITICAL**: The algorithm ONLY matches at the **start** of session UUIDs (prefix matching), not anywhere within them.

**Why This Matters**:
- Prevents accidental collisions from substring matches
- Ensures predictable behavior
- Reduces false positive matches

**Matching Examples**:

Given session UUID: `23e30f82-bee0-4861-8bd3-869ca8a5c8a3`

✅ **Will Match** (prefix):
- `23e30f` → matches start of `23e30f82...`
- `23e30f82` → matches start of `23e30f82...`
- `23e30f82-be` → matches start (dashes stripped)
- `23e30f82bee0` → matches start
- `23e30f82-bee0-4861` → matches start

❌ **Will NOT Match** (not prefix):
- `e30f82` → substring, not at start
- `bee0` → middle segment only
- `8bd3` → end segment only
- `4861-8bd3` → middle/end segments

### Search Strategy

**Two-tier search with priority**:

1. **Primary: Project Transcripts**
   ```bash
   ~/.claude/projects/*/transcripts/${search_string}*.jsonl
   ```
   - Note: No leading `*` before `${search_string}` - this ensures prefix-only matching
   - Searches filenames starting with the search string
   - Extracts full UUIDs from matching filenames
   - Excludes agent sessions (containing `-agent-`)

2. **Fallback: Todo Files**
   ```bash
   ~/.claude/todos/${search_string}*.json
   ```
   - Only searched if primary yields no results
   - Same prefix-only matching logic
   - Excludes agent sessions

**Search Process**:
1. Strip all dashes from input: `23e30f82-bee0` → `23e30f82bee0`
2. Search for files starting with that string: `find ... -name "23e30f82bee0*.jsonl"`
3. Extract UUIDs from matching filenames
4. Deduplicate and return unique matches

### Disambiguation

- **0 matches**: Error with message "No sessions found matching '<partial-id>'"
- **1 match**: Proceed with full UUID
- **Multiple matches**: Display list of matching UUIDs:
  ```
  Multiple sessions found matching '22e10eeb':
    - 22e10eeb-494e-4ffb-969c-04ba272379b4
    - 22e10eeb-7c3e-4d1f-8a2b-9e5f6c7d8e9f

  Please provide more characters to uniquely identify the session.
  ```

### Collision Prevention

The 6-character minimum with prefix-only matching provides excellent collision resistance:

- **6 hex chars** = 16^6 = 16,777,216 possible values
- **Prefix-only** = eliminates substring false matches
- **UUID v4 format** = UUIDs are randomly generated, making prefix collisions rare

**Real-world example**:
- User has 1,000 Claude sessions
- Probability of 6-char prefix collision ≈ 0.003%
- Most users can safely use 6-8 character prefixes

**Recommendation**: Use 6-8 characters for typical usage, more if you notice collisions.

### Implementation Notes

- Use `find` with glob pattern (not `*glob*`, just `glob*`) for prefix matching
- Strip dashes from input before searching: `${partial_id//-/}`
- Use associative array to deduplicate session IDs
- Extract UUIDs from filenames with regex: `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`
- Filter with `grep -v` for `-agent-` exclusion

---

## Tmux Integration

### Reading Session ID from Metadata

The `cld resume` and `cld fork` commands (without explicit session ID) read from tmux pane user options.

**Metadata Key**: `@meta.claude.session_id`

**Reading Command**:
```bash
tmux show-options -pv @meta.claude.session_id 2>/dev/null
```

**Return Values**:
- Full UUID string (e.g., `22e10eeb-494e-4ffb-969c-04ba272379b4`) if metadata exists
- Empty string if metadata not set
- Error if not running in tmux

### Metadata Lifecycle

The session ID is managed by Claude Code hooks defined in `~/.claude/settings.json`:

1. **SessionStart**: Sets `@meta.claude.session_id` to current session UUID
2. **Stop**: Updates session ID (corrects resumed sessions)
3. **UserPromptSubmit**: Updates session ID
4. **SessionEnd**: Final update before cleanup

**Note**: The metadata reflects the session that last ran in the current tmux pane. This enables resuming/forking sessions after Claude has exited.

### Tmux Context Detection

```bash
# Check if $TMUX environment variable is set
if [ -z "$TMUX" ]; then
  echo "Error: Not running in a tmux session"
  exit 4
fi
```

---

## Claude Code Detection

### Environment Variable Check

`cld` detects when it's running inside a Claude Code session by checking the `CLAUDECODE` environment variable.

**Detection Logic**:
```bash
if [ -n "$CLAUDECODE" ]; then
  # Running inside Claude Code
fi
```

**Behavior When Inside Claude Code**:

1. **Basic invocation** (`cld`, `cld resume <sid>`, `cld fork <sid>`):
   - **Error**: Cannot run Claude inside Claude Code
   - **Message**: "Error: Cannot run claude inside a Claude Code session. Use 'cld fork <location>' to run in a new pane/window."
   - **Exit Code**: 7

2. **Fork with location** (`cld fork <location>`):
   - **Allowed**: This uses `run-elsewhere` to execute in a new pane/window/tab
   - **Behavior**: Proceeds normally with elsewhere integration

3. **Fork without location** (`cld fork`):
   - **Allowed with default**: Infers `pane` as default location
   - **Behavior**: Equivalent to `cld fork pane`

### Why This Matters

Running Claude inside an active Claude Code session can cause:
- Conflicting terminal state management
- Corrupted session transcripts
- Resource contention
- Confusing nested prompts

The safety check prevents these issues while still allowing spatial forking to new panes/windows.

---

## Error Handling

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| 0 | Success | Session resumed/forked successfully |
| 1 | Invalid input format | Session ID too short or contains non-hex chars |
| 2 | No matching sessions | Partial ID doesn't match any saved sessions |
| 3 | Ambiguous matches | Multiple sessions match partial ID |
| 4 | Not in tmux context | Tmux-dependent command run outside tmux |
| 5 | No session metadata | No `@meta.claude.session_id` found in current pane |
| 6 | Elsewhere unavailable | `run-elsewhere` command failed or not found |
| 7 | Nested Claude detected | Attempted to run Claude inside Claude Code |

### Error Messages

All error messages should be:
- **Clear**: Explain what went wrong
- **Actionable**: Suggest how to fix the issue
- **Consistent**: Use similar formatting and tone

**Example Error Messages**:

```bash
# Exit code 1
Error: Invalid session ID format. Must be at least 8 hexadecimal characters.
Example: cld resume 22e10eeb

# Exit code 2
Error: No sessions found matching '99z99zzz'.
Run 'claude --list-sessions' to see available sessions.

# Exit code 3
Error: Multiple sessions found matching '22e10eeb'.
Please provide more characters to uniquely identify the session:
  22e10eeb-494e-4ffb-969c-04ba272379b4
  22e10eeb-7c3e-4d1f-8a2b-9e5f6c7d8e9f

# Exit code 4
Error: Not running in a tmux session.
This command requires tmux. Start tmux first or provide an explicit session ID.

# Exit code 5
Error: No Claude session found in current tmux pane.
Run 'cld resume <session-id>' with an explicit session ID instead.

# Exit code 6
Error: Failed to execute run-elsewhere.
Make sure the package is available: npx -y run-elsewhere --version

# Exit code 7
Error: Cannot run claude inside a Claude Code session.
Use 'cld fork <location>' to run in a new pane/window/tab.
Examples:
  cld fork pane    # Fork to new pane
  cld fork tab     # Fork to new window/tab
  cld fork right   # Fork to pane on the right
```

### Error Output

- Write all errors to **stderr** (`>&2`)
- Exit immediately after displaying error
- Never proceed with potentially incorrect assumptions

---

## Implementation Details

### File Structure

**Bash Implementation**:
```
~/.claude/scripts/
├── cld                    # Main executable script
└── fork-session.sh        # [DEPRECATED - to be replaced]
```

**Alias Configuration**:
```bash
# ~/.config/aliases
alias cld='~/.claude/scripts/cld'

# Deprecated (to be removed):
# alias cld='claude'
# alias cldmcp='claude --mcp-config ~/.claude/.mcp-bstock-chores.json'
# alias cldfork='~/.claude/scripts/fork-session.sh'
# alias cldforkmcp='~/.claude/scripts/fork-session.sh --mcp'
```

### Dependencies

**Required**:
- `bash` >= 4.0
- `claude` CLI (installed and in PATH)
- `tmux` (for metadata integration)
- `npx` (for run-elsewhere integration)

**Optional**:
- `run-elsewhere` npm package (for spatial forking)

### Claude Binary Location

The script should invoke Claude as simply `claude`, relying on PATH resolution. This allows for:
- Standard Claude installations
- User-specific Claude builds
- Symlinks to custom versions

**Command Invocation**:
```bash
claude --resume "$SESSION_ID"
# NOT: $HOME/.claude/local/claude
```

### MCP Configuration

The new implementation **removes explicit MCP config flags** and relies on Claude's built-in auto-detection:

- Claude automatically discovers `.mcp.json` in project directories
- Global MCP configs in `~/.claude/.mcp.json` are auto-loaded
- No `--mcp-config` flag needed

**Rationale**: Simplifies command surface and aligns with Claude's intended usage pattern.

### Working Directory Preservation

When forking to a new location via `run-elsewhere`, the current working directory must be preserved:

**Command Structure**:
```bash
npx -y run-elsewhere --no-tty --<location> -- \
  bash -c "cd '$PWD' && claude --resume $SESSION_ID --fork-session"
```

**Shell Escaping**: Use proper quoting to handle paths with spaces:
```bash
cd '/Users/mike/My Documents' && claude --resume ...
```

### Session ID Extraction Script

**Pseudo-code for expansion logic**:

```bash
expand_session_id() {
  local partial_id="$1"

  # Validate input
  if ! echo "$partial_id" | grep -qE '^[0-9a-f]{8,}$'; then
    echo "Error: Invalid session ID format" >&2
    exit 1
  fi

  # Primary search: project transcripts
  local matches=$(find ~/.claude/projects -name "*.jsonl" -type f \
    | xargs grep -o '[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}' \
    | grep -v -- '-agent-' \
    | grep "^$partial_id" \
    | sort -u)

  # Fallback: todo files (only if primary found nothing)
  if [ -z "$matches" ]; then
    matches=$(find ~/.claude/todos -name "*.json" -type f \
      | xargs grep -o '[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}' \
      | grep -v -- '-agent-' \
      | grep "^$partial_id" \
      | sort -u)
  fi

  # Handle results
  local match_count=$(echo "$matches" | wc -l)

  if [ -z "$matches" ]; then
    echo "Error: No sessions found matching '$partial_id'" >&2
    exit 2
  elif [ "$match_count" -gt 1 ]; then
    echo "Error: Multiple sessions found matching '$partial_id':" >&2
    echo "$matches" >&2
    echo "Please provide more characters." >&2
    exit 3
  else
    echo "$matches"  # Return the unique match
  fi
}
```

---

## Migration from v1

### Deprecated Commands

| Old Command | New Equivalent | Notes |
|------------|----------------|-------|
| `cld` | `cld` | No change in basic usage |
| `cldmcp` | `cld` | MCP auto-detection; no flag needed |
| `cldfork <sid>` | `cld fork <sid>` | New subcommand syntax |
| `cldforkmcp <sid>` | `cld fork <sid>` | MCP auto-detection |

### Migration Steps

1. **Update `~/.config/aliases`**:
   - Change `cld` to point to new script
   - Remove `cldmcp`, `cldfork`, `cldforkmcp` aliases
   - Optionally keep old aliases commented out for rollback

2. **Replace script**:
   - Move `~/.claude/scripts/fork-session.sh` to `~/.claude/scripts/fork-session.sh.bak`
   - Install new `~/.claude/scripts/cld`
   - Make executable: `chmod +x ~/.claude/scripts/cld`

3. **Test basic functionality**:
   ```bash
   cld --version                    # Basic passthrough
   cld resume 22e10eeb              # Session expansion
   cld fork                         # Tmux metadata
   cld fork right a4f9fba8          # Spatial forking
   ```

4. **Rollback (if needed)**:
   ```bash
   mv ~/.claude/scripts/fork-session.sh.bak ~/.claude/scripts/fork-session.sh
   # Restore old aliases in ~/.config/aliases
   ```

### Breaking Changes

1. **No `--mcp` flag**: All MCP configs auto-detected
2. **Subcommand syntax**: `cldfork` → `cld fork`
3. **Location argument first**: `cld fork <location> <sid>` (location before session ID)
4. **Explicit errors**: Nested Claude execution prevented

---

## Future TypeScript Package

### Design Goals

1. **Cross-platform**: Works on macOS, Linux, Windows (WSL)
2. **Zero-config**: Works out of the box with sensible defaults
3. **Extensible**: Plugin system for custom behaviors
4. **Testable**: Comprehensive test coverage
5. **Maintainable**: Clean architecture, well-documented

### Package Structure

```
cld/                          # Package root (name TBD)
├── src/
│   ├── cli.ts               # CLI entry point
│   ├── commands/
│   │   ├── resume.ts        # Resume command implementation
│   │   ├── fork.ts          # Fork command implementation
│   │   └── index.ts         # Command registry
│   ├── lib/
│   │   ├── session.ts       # Session ID expansion logic
│   │   ├── tmux.ts          # Tmux integration
│   │   ├── detection.ts     # Environment detection (Claude Code, tmux)
│   │   └── elsewhere.ts     # Run-elsewhere integration
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── utils/
│       ├── errors.ts        # Error classes and handling
│       └── logger.ts        # Logging utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── README.md
```

### CLI Framework

**Recommended**: [Commander.js](https://github.com/tj/commander.js) or [oclif](https://oclif.io/)

**Why Commander.js**:
- Lightweight (~5KB)
- Intuitive subcommand API
- Built-in help generation
- Active maintenance

**Example CLI Structure**:
```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('cld')
  .description('Claude CLI convenience wrapper')
  .version('2.0.0');

program
  .command('resume [session-id]')
  .description('Resume a Claude session')
  .action(async (sessionId?: string) => {
    // Implementation
  });

program
  .command('fork [location] [session-id]')
  .description('Fork a Claude session')
  .action(async (location?: string, sessionId?: string) => {
    // Implementation
  });

program.parse();
```

### Session ID Expansion Module

```typescript
interface SessionMatch {
  fullUuid: string;
  source: 'project' | 'todo';
  filePath: string;
  lastModified: Date;
}

class SessionExpander {
  async expand(partialId: string): Promise<SessionMatch> {
    // Validate input
    // Search project transcripts
    // Fallback to todo files
    // Handle disambiguation
  }

  private async searchFiles(
    glob: string,
    partialId: string
  ): Promise<SessionMatch[]> {
    // File search implementation
  }
}
```

### Tmux Integration Module

```typescript
interface TmuxMetadata {
  sessionId: string | null;
  status: 'running' | 'stopped' | null;
  setOn: 'SessionStart' | 'Stop' | 'UserPromptSubmit' | 'SessionEnd' | null;
}

class TmuxIntegration {
  isInTmux(): boolean {
    return !!process.env.TMUX;
  }

  async readMetadata(): Promise<TmuxMetadata> {
    // Read @meta.claude.* user options
  }

  async getCurrentPane(): Promise<string> {
    return process.env.TMUX_PANE || '';
  }
}
```

### Error Handling

```typescript
class CldError extends Error {
  constructor(
    message: string,
    public exitCode: number,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'CldError';
  }
}

class SessionNotFoundError extends CldError {
  constructor(partialId: string) {
    super(
      `No sessions found matching '${partialId}'`,
      2,
      ["Run 'claude --list-sessions' to see available sessions"]
    );
  }
}

class AmbiguousSessionError extends CldError {
  constructor(partialId: string, matches: string[]) {
    super(
      `Multiple sessions found matching '${partialId}':\n${matches.join('\n')}`,
      3,
      ['Please provide more characters to uniquely identify the session']
    );
  }
}
```

### Testing Strategy

1. **Unit Tests**: Test individual functions and classes
   - Session ID validation
   - UUID pattern matching
   - Error handling

2. **Integration Tests**: Test command workflows
   - Mock Claude CLI
   - Mock tmux environment
   - Mock run-elsewhere

3. **E2E Tests**: Test actual usage
   - Real Claude sessions (in CI with test credentials)
   - Real tmux environment
   - Real directory structures

### Package Naming Candidates

- `cld` (if available)
- `run-cld`
- `cld-cli`
- `claude-launcher`
- `claude-session-manager`

**Selection Criteria**:
1. Available on npmjs.org
2. Short and memorable
3. Clearly related to Claude
4. No conflicts with existing tools

---

## Examples

### Example 1: Basic Claude Invocation

```bash
# Direct passthrough - no special behavior
cld --help
cld "write a function to calculate fibonacci"
cld --model opus "complex reasoning task"
```

**Equivalent to**:
```bash
claude --help
claude "write a function to calculate fibonacci"
claude --model opus "complex reasoning task"
```

---

### Example 2: Resume with Partial Session ID

```bash
# Start a Claude session (using regular claude command)
claude "help me debug this code"
# Session ID: 22e10eeb-494e-4ffb-969c-04ba272379b4

# Later, resume using only first 8 characters
cld resume 22e10eeb
```

**What happens**:
1. Validates `22e10eeb` is 8+ hex characters ✓
2. Searches `~/.claude/projects/*/transcripts/*.jsonl`
3. Finds match: `22e10eeb-494e-4ffb-969c-04ba272379b4`
4. Executes: `claude --resume 22e10eeb-494e-4ffb-969c-04ba272379b4`

---

### Example 3: Resume from Tmux Metadata

```bash
# In a tmux pane where Claude previously ran
tmux show-options -pv @meta.claude.session_id
# Output: 22e10eeb-494e-4ffb-969c-04ba272379b4

# Resume that session
cld resume
```

**What happens**:
1. Checks `$TMUX` environment variable ✓
2. Reads `@meta.claude.session_id` from current pane
3. Finds: `22e10eeb-494e-4ffb-969c-04ba272379b4`
4. Executes: `claude --resume 22e10eeb-494e-4ffb-969c-04ba272379b4`

---

### Example 4: Fork Session to New Pane

```bash
# Working in /Users/mike/Projects/my-app
# Current session: 22e10eeb-494e-4ffb-969c-04ba272379b4

# Fork to a new pane on the right
cld fork right
```

**What happens**:
1. Detects no explicit session ID provided
2. Reads `@meta.claude.session_id` from tmux pane
3. Gets current working directory: `/Users/mike/Projects/my-app`
4. Executes:
   ```bash
   npx -y run-elsewhere --no-tty --right -- \
     bash -c "cd '/Users/mike/Projects/my-app' && claude --resume 22e10eeb-494e-4ffb-969c-04ba272379b4 --fork-session"
   ```
5. New pane opens on the right with forked Claude session in correct directory

---

### Example 5: Fork with Explicit Session ID

```bash
# Fork a different session to a new tab/window
cld fork tab a4f9fba8
```

**What happens**:
1. Validates and expands `a4f9fba8` → `a4f9fba8-7c3e-4d1f-8a2b-9e5f6c7d8e9f`
2. Gets current working directory
3. Executes:
   ```bash
   npx -y run-elsewhere --no-tty --tab -- \
     bash -c "cd '$PWD' && claude --resume a4f9fba8-7c3e-4d1f-8a2b-9e5f6c7d8e9f --fork-session"
   ```
4. New window/tab created with forked session

---

### Example 6: Ambiguous Session ID

```bash
cld resume 22e1
```

**Output**:
```
Error: Multiple sessions found matching '22e1':
  22e10eeb-494e-4ffb-969c-04ba272379b4  (Last modified: 2025-11-02)
  22e1a5c9-7c3e-4d1f-8a2b-9e5f6c7d8e9f  (Last modified: 2025-10-30)

Please provide more characters to uniquely identify the session.
```

**Solution**: Use more characters
```bash
cld resume 22e10eeb  # Unique match
```

---

### Example 7: Running Inside Claude Code

```bash
# Inside an active Claude Code session
echo $CLAUDECODE
# Output: 1

# Try to run Claude directly
cld resume 22e10eeb
```

**Output**:
```
Error: Cannot run claude inside a Claude Code session.
Use 'cld fork <location>' to run in a new pane/window/tab.
Examples:
  cld fork pane    # Fork to new pane
  cld fork tab     # Fork to new window/tab
  cld fork right   # Fork to pane on the right
```

**Solution**: Use spatial forking
```bash
cld fork pane 22e10eeb  # Opens in new pane
```

---

### Example 8: Fork Without Location Inside Claude Code

```bash
# Inside Claude Code, current pane has session metadata
echo $CLAUDECODE
# Output: 1

# Simple fork command
cld fork
```

**What happens**:
1. Detects `CLAUDECODE=1` → inside Claude Code
2. Infers default location: `pane`
3. Reads session ID from tmux metadata
4. Executes: `cld fork pane` (equivalent)
5. Opens forked session in new pane

---

### Example 9: Error - No Session Metadata

```bash
# In a fresh tmux pane with no Claude history
cld resume
```

**Output**:
```
Error: No Claude session found in current tmux pane.
Run 'cld resume <session-id>' with an explicit session ID instead.
```

**Solution**: Provide explicit session ID
```bash
cld resume 22e10eeb
```

---

### Example 10: Complex Workflow

```bash
# 1. Start Claude in tmux pane
claude "help me refactor this module"
# Session: 22e10eeb-494e-4ffb-969c-04ba272379b4

# 2. Exit Claude, work on something else

# 3. Later, resume in same pane
cld resume  # Uses tmux metadata

# 4. Fork to new pane on the left for parallel exploration
cld fork left

# 5. Fork the original session to a new tab for clean slate
cld fork tab 22e10eeb

# Result: 3 Claude sessions running in parallel
# - Original pane: resumed session
# - Left pane: forked session
# - New tab: another forked session
```

---

## Appendix

### Glossary

- **Partial Session ID**: First 8+ characters of a UUID (e.g., `22e10eeb`)
- **Full Session ID**: Complete UUID (e.g., `22e10eeb-494e-4ffb-969c-04ba272379b4`)
- **Tmux Metadata**: User options stored in tmux panes under `@meta.claude.*`
- **Spatial Forking**: Opening a new session in a specific location (pane/window/tab)
- **Session Expansion**: Converting partial ID to full UUID
- **Agent Session**: Claude sub-sessions created by Task tool (excluded from searches)

### Related Tools

- **`claude`**: Official Claude CLI
- **`run-elsewhere`**: Tool for opening commands in new tmux locations
- **`tmux`**: Terminal multiplexer
- **`chezmoi`**: Dotfile manager

### References

- Claude CLI Documentation: https://docs.claude.com/
- run-elsewhere GitHub: https://github.com/mikeymicrophone/run-elsewhere
- tmux Manual: `man tmux`

---

**End of Specification**
