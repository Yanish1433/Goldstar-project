// Dev runner for the API: like `node --watch`, but it restarts only when a file's contents really change.
//
// Why: `node --watch` (libuv) treats every change notification as an edit, and Windows reports *last-access-time*
// updates as changes when NTFS last-access updates are on (the default "System Managed" setting). The first start after
// the files sat idle reads every module, Windows bumps their access times, and the API restarted 2-3 times right after
// `npm run dev`, so the Vite proxy logged ECONNREFUSED. Here a change counts only if the file's mtime or size moved.
//
// Usage (from server/): node scripts/dev-watch.mjs   (watches src/ and .env; same env loading as `npm run dev`)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ENV = path.join(ROOT, '.env');

const stamp = (file) => {
  try {
    const s = fs.statSync(file);
    return s.isFile() ? `${s.mtimeMs}:${s.size}` : null;
  } catch {
    return 'missing';
  }
};

const stamps = new Map();
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else stamps.set(p, stamp(p));
  }
})(SRC);
stamps.set(ENV, stamp(ENV));

/** True when the file's contents (mtime or size) changed since we last looked. Access-time-only events are ignored. */
function changed(file) {
  const now = stamp(file);
  if (now === null || stamps.get(file) === now) return false;
  stamps.set(file, now);
  return true;
}

let child = null;
let stopping = false;
let timer = null;

function start() {
  child = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/index.js'], { cwd: ROOT, stdio: 'inherit' });
  const me = child;
  me.on('exit', (code, signal) => {
    if (child === me && !stopping) console.log(`[dev] API stopped (${signal || `exit ${code}`}). Waiting for a file change to restart...`);
  });
}

function restart(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`[dev] ${path.relative(ROOT, reason)} changed: restarting the API`);
    const old = child;
    child = null;
    if (old && old.exitCode === null && old.signalCode === null) {
      old.once('exit', start);
      old.kill();
    } else start();
  }, 200);
}

fs.watch(SRC, { recursive: true }, (_event, name) => {
  if (!name) return;
  const file = path.join(SRC, name);
  if (changed(file)) restart(file);
});
fs.watch(ROOT, (_event, name) => {
  if (name === '.env' && changed(ENV)) restart(ENV);
});

function stop() {
  stopping = true;
  clearTimeout(timer);
  if (child && child.exitCode === null) {
    child.once('exit', () => process.exit(0));
    child.kill();
  } else process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start();
