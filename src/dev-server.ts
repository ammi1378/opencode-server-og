import { Server } from "./server/server"

// Parse command-line arguments
const args = process.argv.slice(2) // Remove 'bun' and script path
let hostname = "127.0.0.1"
let port = 0

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--hostname" && args[i + 1]) {
    hostname = args[i + 1]
    i++
  } else if (args[i] === "--port" && args[i + 1]) {
    port = parseInt(args[i + 1], 10)
    i++
  }
}

const server = Server.listen({ port, hostname })

console.log(`opencode dev server listening on http://${server.hostname}:${server.port}`)