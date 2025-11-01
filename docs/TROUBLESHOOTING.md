# Troubleshooting

Common issues and solutions when using `run-elsewhere`.

## Permission Issues

### Ghostty/Warp: Operation Not Permitted

**Problem:**
```
Error: Failed to run command in Ghostty/Warp
```

**Cause:** Ghostty and Warp use System Events for automation, which requires Accessibility permissions.

**Solution:**
1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Find your current terminal app in the list (Terminal.app, iTerm2, etc.)
3. Toggle it **ON**
4. Try the command again

**Why is this needed?** Ghostty and Warp don't have public scripting APIs yet, so we use System Events to send keystrokes. macOS requires explicit permission for this.

### AppleScript Permission Prompts

**Problem:** Popup asking for permission every time.

**Cause:** First-time use of AppleScript with Terminal.app or iTerm2.

**Solution:** Click **OK** to allow. macOS will remember your choice.

## Detection Issues

### Terminal Not Detected

**Problem:**
```bash
elsewhere -c "npm run dev"
# Opens Terminal.app instead of my current terminal (iTerm2/kitty)
```

**Cause:** Terminal detection relies on `$TERM_PROGRAM` environment variable, which your terminal might not set.

**Solutions:**

1. **Force the terminal explicitly:**
   ```bash
   elsewhere --terminal=iTerm2 -c "npm run dev"
   ```

2. **Set $TERM_PROGRAM in your shell config:**
   ```bash
   # In ~/.zshrc or ~/.bashrc
   export TERM_PROGRAM="iTerm.app"  # or "kitty", etc.
   ```

3. **Use interactive mode:**
   ```bash
   elsewhere -i -c "npm run dev"
   # Pick from menu
   ```

### "No supported terminal available"

**Problem:**
```
Error: No supported terminal available (exit code 75)
```

**Cause:** No viable backends found. Either:
- Not on macOS (only macOS backends implemented so far)
- Not in tmux/zellij
- No macOS terminals installed

**Solutions:**

1. **Install a supported terminal:**
   - Terminal.app (pre-installed on macOS)
   - iTerm2: https://iterm2.com/
   - kitty: `brew install kitty`

2. **Use a multiplexer:**
   ```bash
   tmux new-session
   # Now run elsewhere
   ```

## SSH Session Issues

### "SSH detected and not inside multiplexer"

**Problem:**
```
Error: SSH detected and not inside multiplexer; cannot open GUI Terminal (exit code 73)
```

**Cause:** You're connected via SSH. GUI terminals can't be opened remotely—they would appear on the server's screen (if it has one), not your local machine.

**Solution:** Use tmux or zellij:

```bash
# Connect via SSH
ssh user@server

# Start tmux
tmux new-session

# Now elsewhere works
elsewhere -c "npm run dev"
```

**Why?** Multiplexers run on the server and create panes within your SSH session.

### Mosh Connections

Same issue and solution as SSH. Mosh connections are detected via `$MOSH_CONNECTION` environment variable.

## Target Degradation

### "does not support panes; degrading to tab"

**Problem:**
```
⚠ iTerm2 does not support panes; degrading to tab
```

**Cause:** You requested `--pane` but iTerm2 doesn't support panes (yet).

**Solutions:**

1. **Accept the degradation** - It still works, just uses tabs instead:
   ```bash
   elsewhere --pane --terminal=iTerm2 -c "npm run dev"
   # Creates a tab instead (with warning)
   ```

2. **Use strict mode** - Fail instead of degrading:
   ```bash
   elsewhere --pane --no --terminal=iTerm2 -c "npm run dev"
   # Error: iTerm2 does not support pane targets
   ```

3. **Switch backends:**
   ```bash
   elsewhere --pane --terminal=tmux -c "npm run dev"
   # Use tmux which supports panes
   ```

### "does not support tabs; degrading to window"

**Problem:**
```
⚠ Terminal.app does not support tabs; degrading to window
```

**Cause:** Requesting tabs from a backend that only supports windows.

**Solution:** Same as above—accept degradation, use `--no`, or switch backends.

## Multiplexer --window Target

### Terminal detection from within multiplexers

**Context:** When using `--window` from inside a tmux or zellij session, `elsewhere` attempts to detect and delegate to the underlying GUI terminal emulator.

**Limitation:** Terminal detection uses the `$TERM_PROGRAM` environment variable, which reflects the environment when the multiplexer session was _started_, not the terminal currently displaying the session. This means:

```bash
# Start tmux in kitty
kitty -e tmux new-session

# Later, attach to tmux from Terminal.app
tmux attach

# Run elsewhere
elsewhere --window -c "npm run dev"
# Still tries to use kitty (from session startup), not Terminal.app (current client)
```

**Solutions:**

1. **Use explicit terminal flag:**
   ```bash
   elsewhere --terminal=Terminal --window -c "npm run dev"
   ```

2. **Create a new multiplexer session from the desired terminal:**
   ```bash
   # Terminal.app
   tmux new-session
   elsewhere --window -c "npm run dev"  # Will detect Terminal.app
   ```

3. **Use interactive mode:**
   ```bash
   elsewhere -i -c "npm run dev"
   # Manually select the terminal from the menu
   ```

**Why this limitation?** Multiplexer sessions are independent of the client connecting to them. The only reliable environment information available to the session is from its startup. Properly detecting the current client's terminal would require accessing the client process's environment from within the session, which is complex and fragile across different terminal emulators.

## Exit Code Reference

When `elsewhere` fails, check the exit code for diagnosis:

| Exit Code | Meaning | Common Causes |
|-----------|---------|---------------|
| `0` | Success | Command executed successfully |
| `1` | Generic failure | Backend execution failed, see error message |
| `64` | Usage error | Missing command, invalid flags |
| `70` | Software error | Backend not available (e.g., tmux not installed) |
| `73` | SSH/GUI infeasible | In SSH without multiplexer |
| `75` | No viable backend | No supported terminals found |

**Checking exit code:**
```bash
elsewhere -c "npm run dev"
echo $?  # Prints exit code
```

## AppleScript Errors

### "AppleScript is only available on macOS"

**Problem:** Trying to use Terminal.app or iTerm2 on Linux.

**Solution:** Use tmux, zellij, or wait for Linux terminal support (future feature).

### "AppleScript triggers permission prompts in remote sessions"

**Problem:** Running over SSH triggers AppleScript permission modal on local machine.

**Cause:** The SSH client (on your local Mac) tries to check for Terminal.app, which triggers AppleScript.

**Solution:** Use multiplexers in SSH (tmux/zellij). AppleScript is blocked in SSH sessions to prevent this issue.

## Command Execution Issues

### Command not found

**Problem:**
```bash
elsewhere -c "npm run dev"
# Error: npm: command not found
```

**Cause:** The new terminal/pane doesn't inherit your shell's PATH or environment.

**Solutions:**

1. **Use full paths:**
   ```bash
   elsewhere -c "/usr/local/bin/npm run dev"
   ```

2. **Source your shell config:**
   ```bash
   elsewhere -c "source ~/.zshrc && npm run dev"
   ```

3. **Use login shell:**
   ```bash
   elsewhere -c "bash -l -c 'npm run dev'"
   ```

### Special characters not working

**Problem:**
```bash
elsewhere -c "echo $HOME"
# Prints your current $HOME, not the new terminal's
```

**Cause:** Shell variable expansion happens before `elsewhere` sees the command.

**Solution:** Escape or quote properly:

```bash
elsewhere -c 'echo $HOME'  # Single quotes prevent expansion
elsewhere -c "echo \$HOME"  # Escape the dollar sign
```

## Interactive Mode Issues

### Menu doesn't appear

**Problem:** Running with `-i` but no menu shows.

**Cause:** Not running in a TTY (piped input/output).

**Solution:** Run in an actual terminal:

```bash
elsewhere -i -c "npm run dev"  # Good

echo "elsewhere -i -c 'npm run dev'" | bash  # Bad (no TTY)
```

### Menu shows but terminal is wrong

**Problem:** Current terminal is detected incorrectly.

**Cause:** `$TERM_PROGRAM` not set or incorrect.

**Solution:** Force the terminal after selection:

```bash
# Set in your shell config
export TERM_PROGRAM="iTerm.app"
```

Or just pick the correct one from the menu.

## Still Having Issues?

1. **Check the version:**
   ```bash
   elsewhere --version
   ```

2. **Use dry-run to debug:**
   ```bash
   elsewhere --dry-run -c "npm run dev"
   ```
   This shows exactly what would be executed.

3. **Check environment:**
   ```bash
   env | grep -E "(TMUX|ZELLIJ|SSH|TERM_PROGRAM)"
   ```

4. **Try forcing a backend:**
   ```bash
   elsewhere --terminal=Terminal -c "npm run dev"
   ```

5. **Report an issue:**
   https://github.com/mikegreiling/run-elsewhere/issues
