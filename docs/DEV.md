# Development Guide

## Setup

```bash
# Install dependencies (pnpm required - enforced via preinstall hook)
pnpm install

# Check that everything works
pnpm lint
pnpm build
pnpm test
```

## Development Workflow

### Local testing

```bash
# Run the CLI locally with tsx
pnpm dev

# Run with custom arguments
pnpm tsx src/cli.ts --help
pnpm tsx src/cli.ts --dry-run -c "echo hi"
```

### Building

```bash
# Build once
pnpm build

# Build output goes to ./dist/cli.cjs

# Test the built binary
node dist/cli.cjs --help
```

### Testing

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for a specific file
pnpm test -- command.test.ts
```

### Linting

```bash
# Check for ESLint violations
pnpm lint

# ESLint config: eslint.config.js
# TypeScript strict checks are enabled
# Type-aware linter rules enabled (requires parserOptions.project)
```

## Project Structure

```
src/
  cli.ts                 # Entry point, yargs setup, main execution loop
  command.ts             # Command resolution (-c, --, stdin precedence)
  constants.ts           # Exit codes, error messages, defaults
  types.ts               # TypeScript interfaces
  detect/
    env.ts               # Environment detection (SSH, tmux, platform)
    apps.ts              # Application detection (Terminal.app)
  planner.ts             # Decision tree, plan generation
  run/
    tmux.ts              # tmux split-window + send-keys
    macos/
      terminal.ts        # AppleScript Terminal.app integration

test/
  unit/
    command.test.ts      # Command resolution tests
    detect.test.ts       # Environment detection tests
    planner.test.ts      # Decision tree tests
```

## Dependencies

### Runtime
- `yargs` - CLI argument parsing

### Development
- `@semantic-release/changelog` - Auto-generates changelog from commits
- `@semantic-release/git` - Updates git with release commits and tags
- `@typescript-eslint/eslint-plugin` - Type-aware ESLint rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@types/node` - Node.js type definitions
- `eslint` - Linter
- `prettier` - Code formatter
- `semantic-release` - Automated versioning and npm publishing
- `tsx` - TypeScript execution (for `pnpm dev`)
- `tsup` - Bundler
- `typescript` - TypeScript compiler
- `vitest` - Test runner

## TypeScript Configuration

- **Strict mode enabled** - `strict: true`
- **Unchecked index access** - `noUncheckedIndexedAccess: true` prevents unsafe array access
- **Type-aware ESLint** - Parser configured with `parserOptions.project: true`

## Publishing & Releases

This project uses **semantic-release** for automatic versioning and npm publishing. Releases are triggered automatically based on git commits using conventional commit messages.

### Setup (One-time)

**Important**: This project has been pre-configured with OIDC Trusted Publishing for secure, token-free npm publishing. See [OIDC_TRUSTED_PUBLISHING.md](OIDC_TRUSTED_PUBLISHING.md) for details.

1. **GitHub repository created** at `github.com/mikegreiling/run-elsewhere` ✅
2. **npm token configured** as GitHub secret (for initial publish only) ✅
3. **GitHub Actions workflow ready** with OIDC support ✅
4. **Code pushed to GitHub** ✅

### First Release (Uses Token)

When you're ready for the first release:

```bash
git commit -m "feat: initial release"
git push origin main
```

This will use your `NPM_TOKEN` to publish the first version to npm.

### After First Publish: Switch to OIDC (Highly Recommended)

After the package is published, follow the instructions in [OIDC_TRUSTED_PUBLISHING.md](OIDC_TRUSTED_PUBLISHING.md) to:
1. Configure GitHub Actions as a trusted publisher on npmjs.com
2. Optionally remove the NPM_TOKEN secret for enhanced security
3. All future publishes will use OIDC (no token expiration!)

### Making Releases

Releases are **fully automated** via GitHub Actions. Just commit and push to `main` with conventional commit messages:

**Commit message examples:**
```
feat: add support for iTerm2          → Version bump: MINOR (0.1.0 → 0.2.0)
fix: handle SSH sessions correctly    → Version bump: PATCH (0.1.0 → 0.1.1)
docs: update README                   → No version bump, no release
BREAKING CHANGE: restructure API      → Version bump: MAJOR (0.1.0 → 1.0.0)
```

**Workflow**:
1. Make code changes
2. Commit with conventional message: `git commit -m "feat: add new feature"`
3. Push to main: `git push origin main`
4. GitHub Actions automatically:
   - Runs tests and linting
   - Analyzes commit messages
   - Updates version in package.json (if needed)
   - Publishes to npm (if needed)
   - Creates CHANGELOG.md entries
   - Pushes updated files back to git with release tag

### Manual Release (if needed)

If automated release doesn't work or you need to manually trigger:

```bash
# Locally (requires NPM_TOKEN in environment)
export NPM_TOKEN="your-npm-token"
pnpm semantic-release
```

Or trigger manually via GitHub Actions UI → "Release" workflow → "Run workflow".

## Troubleshooting

### ESLint type errors

If you see "Cannot find tsconfig.json", make sure the ESLint config has:
```js
parserOptions: {
  project: true,
  tsconfigRootDir: import.meta.dirname,
}
```

### Build fails with TypeScript errors

- Check for `noUncheckedIndexedAccess` violations (accessing arrays without checking bounds)
- Ensure return types are explicitly annotated
- Run `npm run lint` to check all violations

### Tests fail

- Make sure all imports use `.js` extensions (ESM support)
- Check that test files are in `test/` directory (ignored by tsconfig)
- Run `npm test -- --reporter=verbose` for more details

## Next Steps (Phase 2)

See [ROADMAP.md](ROADMAP.md) for what's planned next:
- Additional terminal backends (iTerm2, kitty, zellij, etc.)
- Tab creation support
- Interactive mode
- Enhanced error handling
