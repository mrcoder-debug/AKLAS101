import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3000;
export const BASE_URL = `http://localhost:${PORT}`;

function isUp() {
  return new Promise(resolve => {
    http.get(BASE_URL, res => { res.resume(); resolve(true); })
      .on('error', () => resolve(false));
  });
}

async function waitForServer(maxMs = 60_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await isUp()) return;
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error('Dev server did not become ready within 60s');
}

let proc = null;

export async function startServer() {
  if (await isUp()) {
    console.log(`[serve] Reusing existing server at ${BASE_URL}`);
    return false;
  }
  console.log('[serve] Starting Next.js dev server…');
  proc = spawn('pnpm', ['dev'], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stdout.on('data', d => process.stdout.write(d));
  proc.stderr.on('data', d => process.stderr.write(d));
  await waitForServer();
  console.log(`[serve] Ready → ${BASE_URL}\n`);
  return true;
}

export async function stopServer() {
  if (proc) {
    proc.kill('SIGTERM');
    proc = null;
  }
}

// Standalone: node scripts/serve.js — starts the server and keeps it alive
const __filename = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1]) === path.resolve(__filename)) {
  await startServer();
  console.log('[serve] Press Ctrl+C to stop');
  process.on('SIGINT', async () => {
    await stopServer();
    process.exit(0);
  });
}
