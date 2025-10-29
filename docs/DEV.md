# Development Guide

## Setup

```bash
# Install dependencies
npm install

# Check that everything works
npm run lint
npm run build
npm test
```

## Development Workflow

### Local testing

```bash
# Run the CLI locally with tsx
npm run dev

# Run with custom arguments
npx tsx src/cli.ts --help
npx tsx src/cli.ts --dry-run -c "echo hi"
```

### Building

```bash
# Build once
npm run build

# Build output goes to ./dist/cli.cjs

# Test the built binary
node dist/cli.cjs --help
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for a specific file
npm test -- command.test.ts
```

### Linting

```bash
# Check for ESLint violations
npm run lint

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
- `@typescript-eslint/eslint-plugin` - Type-aware ESLint rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@types/node` - Node.js type definitions
- `eslint` - Linter
- `prettier` - Code formatter
- `tsx` - TypeScript execution (for `npm run dev`)
- `tsup` - Bundler
- `typescript` - TypeScript compiler
- `vitest` - Test runner

## TypeScript Configuration

- **Strict mode enabled** - `strict: true`
- **Unchecked index access** - `noUncheckedIndexedAccess: true` prevents unsafe array access
- **Type-aware ESLint** - Parser configured with `parserOptions.project: true`

## Publishing

### Before publishing

- Update version in `package.json`
- Update version in this document if needed
- Ensure tests pass: `npm test`
- Ensure build passes: `npm run build`
- Ensure no ESLint errors: `npm run lint`

### Publishing to npm

```bash
# Login (if not already logged in)
npm login

# Publish
npm publish --access public
```

The `prepare` script in package.json will automatically build before publishing.

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
