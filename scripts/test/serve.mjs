// Serves dist/ with the production headers on a fixed port (for Lighthouse and manual checks).
// Usage: node scripts/test/serve.mjs [port]
import { startServer } from "./lib.mjs";
const port = Number(process.argv[2] ?? 4450);
const server = await startServer(port);
console.log(`Serving dist/ at ${server.base} (Ctrl+C to stop)`);
