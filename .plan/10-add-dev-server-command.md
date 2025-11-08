# Implementation Plan: Add dev:server Command

## Implementation Overview

This implementation plan follows the **Option 1 (Dedicated Dev Server Command)** approach recommended in the architectural analysis. The goal is to create a new `dev:server` npm script that starts only the server component in development mode without the terminal UI, providing developers with a quick and convenient way to interact with the server API directly.

### Key Objectives
- Create a dedicated development server command that bypasses the terminal UI
- Reuse existing `Server.listen()` infrastructure from `src/server/server.ts`
- Provide development-friendly defaults (auto-port assignment, localhost binding)
- Maintain consistency with existing CLI command patterns
- Log clear connection information for developer convenience

### Architecture Pattern
```
package.json dev:server → src/cli/cmd/dev-server.ts → Server.listen()
```

This approach:
- Follows existing CLI patterns (`serve`, `debug`, etc.)
- Maintains architectural consistency with namespace-based organization
- Enables future extensibility for development-specific features
- Provides clear separation between production (`serve`) and development (`dev-server`) modes

## Component Details

### 1. New Command File: `src/cli/cmd/dev-server.ts`

**Purpose:** Define a new CLI command specifically for development server startup

**Responsibilities:**
- Import and invoke `Server.listen()` with development-optimized defaults
- Log server connection information in a developer-friendly format
- Keep the server running until manually stopped
- Follow existing command patterns using `cmd()` helper

**Key Features:**
- Development-friendly defaults (port 0 for auto-assignment, localhost binding)
- Clear console output with connection URL
- No command-line arguments required (pure convenience command)
- Infinite lifecycle until manual termination

**Integration Points:**
- Imports `Server` from `../../server/server`
- Imports `cmd` from `./cmd` for command definition
- Exports `DevServerCommand` for registration in CLI

### 2. CLI Registration: `src/index.ts`

**Purpose:** Register the new `dev-server` command with the yargs CLI

**Modifications Required:**
- Import `DevServerCommand` from `./cli/cmd/dev-server`
- Add command to yargs command chain
- Ensure command appears in help output

**Integration Points:**
- Existing yargs CLI setup
- Command registration pattern (similar to `ServeCommand`, `DebugCommand`, etc.)

### 3. NPM Script: `package.json`

**Purpose:** Provide a convenient npm script for running the development server

**Modifications Required:**
- Add new `dev:server` script to the `scripts` section
- Script should invoke the CLI with the `dev-server` command

**Integration Points:**
- Existing npm scripts (`dev`, `build`, etc.)
- Bun runtime execution

### 4. Server Infrastructure: `src/server/server.ts` (No Changes)

**Purpose:** Existing server infrastructure that will be reused

**Reuse Strategy:**
- `Server.listen()` method accepts `port` and `hostname` options
- Returns server instance with connection details
- Already implements full Hono-based REST API
- No modifications required

## Data Structures

### 1. Command Definition Schema

```typescript
// File: src/cli/cmd/dev-server.ts
export const DevServerCommand = cmd({
  command: "dev-server",
  describe: "starts opencode server in development mode",
  handler: async () => {
    // Implementation
  }
})
```

**Fields:**
- `command`: String identifier for the CLI command
- `describe`: Human-readable description for help output
- `handler`: Async function that executes the command logic

**No additional parameters needed** - This command uses hardcoded development defaults for simplicity

### 2. Server Configuration

```typescript
// Development server defaults
{
  port: 0,        // Auto-assign available port
  hostname: "127.0.0.1"  // Localhost only for security
}
```

**Rationale:**
- `port: 0` - Let the OS assign an available port to avoid conflicts
- `hostname: "127.0.0.1"` - Restrict to localhost for development security

### 3. Server Return Type

```typescript
// Returned by Server.listen()
{
  hostname: string,
  port: number,
  stop: () => Promise<void>
}
```

**Usage:**
- `hostname` and `port` - Display connection URL to developer
- `stop()` - Called on cleanup (optional, server runs indefinitely)

## API Design

### 1. Command API

**Command:** `dev-server`

**Syntax:**
```bash
bun run ./src/index.ts dev-server
```

**Simplified via npm script:**
```bash
bun run dev:server
```

**Parameters:** None (zero-configuration by design)

**Exit Behavior:** Runs indefinitely until SIGINT (Ctrl+C) or SIGTERM

### 2. Internal Function Call

**Function:** `Server.listen()`

**Signature:**
```typescript
function listen(opts: { port: number; hostname: string }): {
  hostname: string;
  port: number;
  stop: () => Promise<void>;
}
```

**Call Pattern:**
```typescript
const server = Server.listen({
  port: 0,
  hostname: "127.0.0.1"
})
```

**Return Value Usage:**
```typescript
console.log(`🚀 opencode dev server running on http://${server.hostname}:${server.port}`)
```

### 3. Console Output Design

**Format:**
```
🚀 opencode dev server running on http://127.0.0.1:3456
```

**Characteristics:**
- Emoji prefix for visual clarity
- Full URL format (http://hostname:port) for easy copy-paste
- Port number dynamically assigned and displayed

## Testing Strategy

### 1. Manual Testing Checklist

**Basic Functionality:**
- [ ] Run `bun run dev:server` and verify server starts
- [ ] Verify console output displays correct connection URL
- [ ] Access the server at the displayed URL
- [ ] Verify API endpoints respond correctly
- [ ] Test server shutdown with Ctrl+C
- [ ] Verify no port conflicts when running multiple times

**Integration Testing:**
- [ ] Run `dev:server` alongside the full `dev` command (ensure no conflicts)
- [ ] Test with existing `serve` command to compare behavior
- [ ] Verify CLI help output includes new command (`bun run ./src/index.ts --help`)
- [ ] Test command via direct CLI invocation (`bun run ./src/index.ts dev-server`)

**API Validation:**
- [ ] Test GET /doc (OpenAPI documentation endpoint)
- [ ] Test GET /session (list sessions)
- [ ] Test POST /session (create session)
- [ ] Test GET /config (get configuration)
- [ ] Verify CORS headers are present
- [ ] Test SSE endpoint GET /event

### 2. Automated Testing Considerations

**Unit Tests (Optional - Low Priority):**
```typescript
// test/cli/dev-server.test.ts
import { DevServerCommand } from "@/cli/cmd/dev-server"

test("dev-server command has correct metadata", () => {
  expect(DevServerCommand.command).toBe("dev-server")
  expect(DevServerCommand.describe).toContain("development mode")
})
```

**Integration Tests (Future Enhancement):**
- Test server startup and shutdown lifecycle
- Verify port auto-assignment behavior
- Test signal handling (SIGINT/SIGTERM)

### 3. Regression Testing

**Verify Existing Functionality:**
- [ ] Ensure existing `serve` command still works
- [ ] Ensure existing `dev` command (full terminal UI) still works
- [ ] Verify no changes to `Server.listen()` behavior
- [ ] Run existing test suite: `bun test`
- [ ] Typecheck: `bun run typecheck`

## Development Phases

### Phase 1: Core Implementation (Estimated: 15-20 minutes)

**Step 1.1: Create Command File**
- Create `src/cli/cmd/dev-server.ts`
- Import required dependencies (`Server`, `cmd`)
- Define command metadata (command name, description)
- Implement handler function with development defaults
- Add infinite wait pattern (`await new Promise(() => {})`)
- Add console log with connection URL

**Step 1.2: Register Command**
- Open `src/index.ts`
- Import `DevServerCommand` from `./cli/cmd/dev-server`
- Add command to yargs command chain (similar to existing commands)
- Verify command registration follows existing patterns

**Step 1.3: Add NPM Script**
- Open `package.json`
- Add `"dev:server": "bun run ./src/index.ts dev-server"` to scripts section
- Ensure proper JSON formatting

**Validation:**
- Typecheck passes: `bun run typecheck`
- Manual test: `bun run dev:server` starts server
- Console output displays connection URL

### Phase 2: Testing & Validation (Estimated: 10-15 minutes)

**Step 2.1: Manual Testing**
- Execute manual testing checklist (see Testing Strategy section)
- Verify server starts correctly
- Test API endpoints
- Verify port auto-assignment
- Test shutdown behavior

**Step 2.2: Integration Testing**
- Run alongside existing `dev` command (no conflicts)
- Compare behavior with `serve` command
- Test CLI help output

**Step 2.3: Documentation Verification**
- Verify command appears in `bun run ./src/index.ts --help`
- Ensure description is clear and helpful

**Validation:**
- All manual tests pass
- No conflicts with existing commands
- Clean shutdown on Ctrl+C

### Phase 3: Code Review & Polish (Estimated: 5-10 minutes)

**Step 3.1: Code Quality Review**
- Verify code follows project style guidelines
- Ensure consistent naming conventions (camelCase)
- Check import organization (relative imports)
- Verify error handling patterns

**Step 3.2: Documentation**
- Add inline comments if necessary
- Ensure command description is clear
- Verify console output is user-friendly

**Step 3.3: Final Testing**
- Run full test suite: `bun test`
- Run typecheck: `bun run typecheck`
- Test both npm script and direct CLI invocation

**Validation:**
- All tests pass
- Typecheck passes
- Code meets project standards

### Phase 4: Deployment (Estimated: 5 minutes)

**Step 4.1: Final Verification**
- Clean build verification
- Test from fresh install (if applicable)
- Verify no uncommitted changes outside scope

**Step 4.2: Completion Checklist**
- [ ] Command file created and implemented
- [ ] Command registered in CLI
- [ ] NPM script added
- [ ] All tests pass
- [ ] Typecheck passes
- [ ] Manual testing completed
- [ ] Documentation updated (if required)

## Development Guidelines

### Code Style Compliance

**TypeScript Patterns:**
```typescript
// ✅ Correct: Use namespace imports
import { Server } from "../../server/server"
import { cmd } from "./cmd"

// ❌ Incorrect: Avoid default imports
import Server from "../../server/server"
```

**Naming Conventions:**
```typescript
// ✅ Correct: PascalCase for command exports
export const DevServerCommand = cmd({ ... })

// ✅ Correct: camelCase for local variables
const server = Server.listen({ ... })

// ❌ Incorrect: snake_case
const dev_server = Server.listen({ ... })
```

**Error Handling:**
```typescript
// ✅ Correct: Use existing error patterns (minimal needed)
handler: async () => {
  const server = Server.listen({ port: 0, hostname: "127.0.0.1" })
  // Server.listen() handles its own errors
}

// Note: No try-catch needed - errors bubble up to CLI error handler
```

### Integration Patterns

**Command Registration Pattern:**
```typescript
// File: src/index.ts
import { DevServerCommand } from "./cli/cmd/dev-server"

// Add to command chain (illustrative - actual code may vary)
yargs
  .command(ServeCommand)
  .command(DevServerCommand)  // Add here
  .command(DebugCommand)
  // ... other commands
```

**Server Lifecycle Pattern:**
```typescript
// Keep server running indefinitely
const server = Server.listen({ port: 0, hostname: "127.0.0.1" })
console.log(`🚀 opencode dev server running on http://${server.hostname}:${server.port}`)
await new Promise(() => {}) // Infinite wait
```

### Best Practices

**1. Simplicity First**
- Keep the command implementation minimal
- No configuration options (zero-config for dev convenience)
- Rely on existing server infrastructure

**2. Developer Experience**
- Clear, colorful console output (emoji prefix)
- Full URL format for easy copy-paste
- Immediate feedback on server startup

**3. Consistency**
- Follow existing command patterns (see `ServeCommand`)
- Use established logging conventions
- Maintain architectural patterns

**4. Security**
- Default to localhost binding (127.0.0.1)
- Document that this is for development only
- Auto-port assignment prevents conflicts

## Illustrative Code Snippets

### Complete Command Implementation

```typescript
// File: src/cli/cmd/dev-server.ts
import { Server } from "../../server/server"
import { cmd } from "./cmd"

export const DevServerCommand = cmd({
  command: "dev-server",
  describe: "starts opencode server in development mode",
  handler: async () => {
    const server = Server.listen({
      port: 0,        // Auto-assign available port
      hostname: "127.0.0.1"  // Localhost only
    })
    
    console.log(`🚀 opencode dev server running on http://${server.hostname}:${server.port}`)
    
    // Keep server running indefinitely until SIGINT/SIGTERM
    await new Promise(() => {})
    
    // Cleanup (may not be reached in normal operation)
    await server.stop()
  },
})
```

### NPM Script Addition

```json
// File: package.json
{
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "test": "bun test",
    "build": "./script/build.ts",
    "dev": "bun run --conditions=browser ./src/index.ts",
    "dev:server": "bun run ./src/index.ts dev-server"
  }
}
```

### CLI Registration Example

```typescript
// File: src/index.ts
import { DevServerCommand } from "./cli/cmd/dev-server"

// Register command with yargs
// (Actual implementation depends on existing CLI setup)
yargs.command(DevServerCommand)
```

## Risk Analysis & Mitigation

### Risk 1: Port Conflicts
**Description:** Multiple instances of dev server trying to use the same port

**Mitigation:**
- Use port 0 for automatic OS-level port assignment
- Each instance gets a unique port automatically
- Display assigned port clearly in console output

**Testing:** Start multiple dev server instances simultaneously

### Risk 2: Infinite Loop Behavior
**Description:** `await new Promise(() => {})` could be unclear to developers

**Mitigation:**
- Add inline comment explaining infinite wait pattern
- Document that server runs until manual termination
- Ensure proper signal handling for clean shutdown

**Testing:** Test Ctrl+C shutdown behavior

### Risk 3: Inconsistency with Production
**Description:** Development server behaves differently from production `serve` command

**Mitigation:**
- Both commands use same `Server.listen()` implementation
- Only difference is default parameter values
- Document the distinction clearly in command descriptions

**Testing:** Compare API responses between `dev:server` and `serve`

### Risk 4: Missing Environment Setup
**Description:** Development server might need additional setup not present in production

**Mitigation:**
- Reuse existing server infrastructure (no special setup)
- `Server.listen()` handles all initialization
- No additional dependencies required

**Testing:** Fresh clone test with `bun install && bun run dev:server`

## Success Criteria

### Functional Requirements
- ✅ New `dev:server` npm script exists in package.json
- ✅ Running `bun run dev:server` starts the server
- ✅ Server starts without requiring command-line arguments
- ✅ Console output displays connection URL
- ✅ Server binds to localhost (127.0.0.1)
- ✅ Port is automatically assigned (no conflicts)
- ✅ API endpoints are accessible and functional
- ✅ Server runs until manually stopped (Ctrl+C)

### Quality Requirements
- ✅ Typecheck passes (`bun run typecheck`)
- ✅ Existing tests still pass (`bun test`)
- ✅ Code follows project style guidelines (see AGENTS.md)
- ✅ Command appears in CLI help output
- ✅ No regressions in existing functionality

### Developer Experience
- ✅ Zero-configuration startup (no arguments needed)
- ✅ Clear, actionable console output
- ✅ Quick startup time (minimal overhead)
- ✅ Can run alongside other commands without conflicts
- ✅ Easy to discover (`--help` shows the command)

### Integration Requirements
- ✅ Follows existing CLI command patterns
- ✅ Reuses `Server.listen()` without modifications
- ✅ Consistent with project architecture
- ✅ No breaking changes to existing commands

## Future Enhancements

### Potential Additions (Out of Scope for Initial Implementation)

**1. Development-Specific Features**
- Hot reload on code changes (using file watcher)
- Debug-level logging enabled by default
- Development-only middleware (request logging, etc.)
- Auto-open browser on startup

**2. Configuration Options**
- Optional port override via environment variable
- Custom hostname for network access (0.0.0.0)
- Development-specific CORS settings

**3. Developer Tools Integration**
- Integration with Bun's built-in debugger
- Performance profiling in development mode
- Request/response logging middleware

**4. Enhanced CLI Options**
- `--open` flag to auto-open browser
- `--debug` flag for verbose logging
- `--port` flag to override auto-assignment

**Note:** These enhancements should be considered after the initial implementation is complete and validated. The initial implementation focuses on simplicity and minimal functionality.

## References

### Existing Code Patterns
- **Command Definition:** `src/cli/cmd/serve.ts` (similar structure)
- **Server Setup:** `src/server/server.ts` (Server.listen implementation)
- **CLI Registration:** `src/index.ts` (yargs setup)

### Documentation
- **Agent Guidelines:** `AGENTS.md` (code style, patterns)
- **Architecture Analysis:** `.plan/arch_10-add-dev-server-command.md`
- **Task Requirements:** `.task/10-add-dev-server-command.md`

### Related Commands
- `serve` - Production headless server with configurable options
- `dev` - Full terminal UI with server
- `debug` - Debug mode commands

## Appendix: Architecture Decisions

### Why Option 1 (Dedicated Dev Server Command)?

**Comparison with Alternatives:**

**Option 1: Dedicated Dev Server Command (SELECTED)**
- ✅ Follows existing CLI patterns
- ✅ Easy to extend with dev-specific features
- ✅ Consistent with project architecture
- ✅ Clear separation from production `serve` command
- ⚠️ Requires CLI registration

**Option 2: Direct Server Entry Point**
- ✅ Maximum simplicity
- ✅ Fastest startup time
- ❌ Bypasses existing CLI infrastructure
- ❌ Harder to extend with options
- ❌ Less consistent with project patterns

**Option 3: CLI Wrapper Script**
- ✅ Zero new code
- ✅ Immediate implementation
- ❌ Less flexible for future enhancements
- ❌ CLI parsing overhead
- ❌ Harder to add dev-specific customizations

**Decision Rationale:**
Option 1 provides the best balance of consistency, maintainability, and extensibility while following established project patterns. The slight overhead of CLI registration is outweighed by the benefits of architectural consistency and future flexibility.

### Development vs Production Separation

**Development Mode (dev:server):**
- Auto-port assignment (port: 0)
- Localhost binding only (127.0.0.1)
- Zero-configuration (no arguments)
- Developer-friendly output (emoji, full URL)

**Production Mode (serve):**
- Configurable port (default: 0)
- Configurable hostname (default: 127.0.0.1)
- CLI arguments for customization
- Production-appropriate output

This separation allows different optimizations and defaults for each use case while maintaining the same underlying server implementation.
