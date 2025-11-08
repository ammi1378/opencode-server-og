# Task: Add dev:server Command

## Problem Statement

Currently, the `dev` command in `package.json` starts the full terminal app using `bun run --conditions=browser ./src/index.ts`. There is a need for a dedicated command that runs only the server component without the terminal UI, which would be useful for development scenarios where you want to interact with the server API directly or use it with a separate client.

## Requirements

1. Create a new `dev:server` command in `package.json` that starts only the server
2. The command should start the server in development mode (similar to the existing `serve` command but optimized for dev workflow)
3. Ensure the server is accessible and logs appropriate connection information
4. The command should be separate from the existing `dev` command which launches the full terminal app
5. Consider reusing existing server infrastructure from `src/server/server.ts` and `src/cli/cmd/serve.ts`

## Expected Outcome

- A new `dev:server` npm script in `package.json` that can be run with `bun run dev:server`
- The script should start the headless server (similar to `serve` command) but in development mode
- Server should log its listening address (hostname:port) to the console
- The server should stay running until manually stopped
- The implementation should follow the project's existing patterns and architecture

## Additional Context

### Current Architecture

The project uses:
- **Entry point**: `src/index.ts` - CLI application using yargs
- **Server command**: `src/cli/cmd/serve.ts` - Defines the `serve` command that starts a headless server
- **Server implementation**: `src/server/server.ts` - Contains `Server.listen()` method that:
  - Uses Bun.serve() to create the HTTP server
  - Accepts `port` and `hostname` options
  - Returns a server instance with `hostname`, `port`, and `stop()` method
  - Provides a full Hono-based REST API

### Existing Commands
- `dev`: Runs the full terminal app with `bun run --conditions=browser ./src/index.ts`
- `serve`: CLI command that starts headless server (requires command-line arguments)

## Suggested Implementation Approach

1. Create a new file (e.g., `src/cli/cmd/dev-server.ts` or reuse serve logic)
2. Add a simple script entry in `package.json` that directly invokes the server
3. Could be as simple as creating a dedicated entry point file that imports and calls `Server.listen()` directly
4. Alternatively, create an npm script that calls the existing `serve` command with default development parameters

## Other Important Agreements

- The user wants to understand how the project starts a server before implementing the solution
- The solution should maintain consistency with existing project architecture (Bun runtime, TypeScript ESM modules)
- The command should be developer-friendly and quick to start for local development
