# Architecture Analysis: Add dev:server Command

## Context Analysis

The task requires creating a new `dev:server` npm script that starts only the server component without the terminal UI. Currently, the project has:

- **`dev` script**: Runs full terminal app with `bun run --conditions=browser ./src/index.ts`
- **`serve` command**: CLI command that starts headless server with configurable port/hostname
- **Server infrastructure**: Well-structured Hono-based REST API in `src/server/server.ts`

The goal is to provide a quick development server entry point that developers can use without dealing with CLI arguments, while reusing existing server infrastructure.

## Technology Recommendations

### Core Technologies
- **Bun Runtime**: Continue using Bun for consistent runtime environment
- **Hono Framework**: Leverage existing Hono-based server implementation
- **TypeScript ESM**: Maintain existing module structure and patterns
- **Yargs CLI**: Reuse existing CLI command patterns for consistency

### Development Server Patterns
- **Minimal Entry Point**: Create a lightweight script that directly calls `Server.listen()`
- **Development Defaults**: Use sensible defaults (localhost, auto-port) for quick startup
- **Logging**: Provide clear connection information for developers

## System Architecture

### Current Architecture Flow
```
src/index.ts (CLI) → yargs → ServeCommand → Server.listen()
```

### Proposed Architecture Options

#### Option 1: Dedicated Dev Server Script (Recommended)
```
package.json dev:server → src/cli/cmd/dev-server.ts → Server.listen()
```

**Components:**
- `src/cli/cmd/dev-server.ts`: New command with development-focused defaults
- `package.json`: Add `dev:server` script pointing to the new command
- Reuse existing `Server.listen()` method

#### Option 2: Direct Server Entry Point
```
package.json dev:server → src/dev-server.ts → Server.listen()
```

**Components:**
- `src/dev-server.ts`: Standalone entry point (bypasses CLI entirely)
- Direct import and call of server functionality
- Minimal overhead, maximum simplicity

#### Option 3: CLI Wrapper Script
```
package.json dev:server → bun run opencode serve --port 0 --hostname 127.0.0.1
```

**Components:**
- Simple npm script that calls existing serve command with defaults
- No new code required
- Leverages existing CLI infrastructure

## Integration Patterns

### IMPORTANT: Server Integration
- **Reuse `Server.listen()`**: The existing method in `src/server/server.ts` is well-designed and should be reused
- **Development Mode**: Consider enabling development-specific features (debug logging, hot reload if applicable)
- **Port Management**: Use port 0 for automatic port assignment in development

### Logging Integration
- **Consistent Logging**: Use existing `Log.create({ service: "dev-server" })` pattern
- **Connection Info**: Log server URL clearly for developers
- **Error Handling**: Follow existing error handling patterns with `NamedError`

### Configuration Integration
- **Default Values**: Use sensible development defaults (localhost:0)
- **Environment Awareness**: Detect development vs production environments
- **Config Loading**: Reuse existing `Config` namespace if needed

## Implementation Guidance

### Option 1: Dedicated Dev Server Command (Recommended)

**File: `src/cli/cmd/dev-server.ts`**
```typescript
import { Server } from "../../server/server"
import { cmd } from "./cmd"

export const DevServerCommand = cmd({
  command: "dev-server",
  describe: "starts opencode server in development mode",
  handler: async () => {
    const server = Server.listen({
      port: 0,        // Auto-assign port
      hostname: "127.0.0.1"
    })
    console.log(`🚀 opencode dev server running on http://${server.hostname}:${server.port}`)
    await new Promise(() => {}) // Keep running
  },
})
```

**Integration Steps:**
1. Create `src/cli/cmd/dev-server.ts` with development-focused defaults
2. Import and register `DevServerCommand` in `src/index.ts`
3. Add `"dev:server": "bun run ./src/index.ts dev-server"` to `package.json`

### Option 2: Direct Server Entry Point

**File: `src/dev-server.ts`**
```typescript
import { Server } from "./server/server"
import { Log } from "./util/log"

async function main() {
  const server = Server.listen({
    port: 0,
    hostname: "127.0.0.1"
  })
  console.log(`🚀 opencode dev server running on http://${server.hostname}:${server.port}`)
  await new Promise(() => {})
}

main().catch(console.error)
```

**Integration Steps:**
1. Create `src/dev-server.ts` as standalone entry point
2. Add `"dev:server": "bun run ./src/dev-server.ts"` to `package.json`

### Option 3: CLI Wrapper

**package.json addition:**
```json
"dev:server": "bun run ./src/index.ts serve --port 0 --hostname 127.0.0.1"
```

**Integration Steps:**
1. Add script to `package.json`
2. No code changes required

## Trade-offs Analysis

### Option 1: Dedicated Dev Server Command
**Pros:**
- Follows existing CLI patterns
- Easy to extend with additional dev-specific features
- Consistent with project architecture
- Can add dev-specific options later

**Cons:**
- Requires CLI registration
- Slightly more complex than direct entry point

### Option 2: Direct Server Entry Point
**Pros:**
- Maximum simplicity
- Minimal overhead
- Fastest startup time
- No CLI dependencies

**Cons:**
- Bypasses existing CLI infrastructure
- Harder to extend with command-line options
- Less consistent with project patterns

### Option 3: CLI Wrapper
**Pros:**
- Zero new code
- Leverages existing functionality
- Immediate implementation

**Cons:**
- Less flexible for future enhancements
- Depends on CLI parsing overhead
- Harder to add dev-specific customizations

## Security Considerations

### Development Server Security
- **Localhost Binding**: Default to `127.0.0.1` for security in development
- **Port Selection**: Use auto-assignment to avoid conflicts
- **Access Control**: Document that this is for development only

### API Security
- **CORS**: Existing CORS configuration will apply
- **Authentication**: Reuse existing auth mechanisms
- **Rate Limiting**: Consider if development needs different limits

## Performance Considerations

### Startup Performance
- **Minimal Dependencies**: Direct server startup without CLI overhead
- **Lazy Loading**: Existing lazy patterns in server should be maintained
- **Development Optimizations**: Consider enabling development-specific optimizations

### Resource Usage
- **Memory**: Server should have similar footprint to existing serve command
- **CPU**: No additional computational overhead expected
- **Network**: Standard HTTP server performance

## Maintainability Considerations

### Code Organization
- **Consistent Patterns**: Follow existing command structure if using CLI approach
- **Documentation**: Add clear comments about development-specific behavior
- **Testing**: Consider adding tests for the new command

### Future Extensibility
- **Configuration**: Allow easy addition of dev-specific configuration options
- **Plugins**: Consider how development server might interact with plugin system
- **Monitoring**: Add development-specific monitoring if needed

## Recommendation

**IMPORTANT: Recommended Approach - Option 1 (Dedicated Dev Server Command)**

This approach provides the best balance of:
- **Consistency** with existing project architecture
- **Flexibility** for future development-specific features
- **Maintainability** through established patterns
- **Developer Experience** with clear, focused functionality

The implementation should start simple with basic server startup, then evolve to include development-specific enhancements like hot reload, debug logging, or development-only middleware as needed.