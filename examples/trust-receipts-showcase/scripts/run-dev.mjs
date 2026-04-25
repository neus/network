import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const require = createRequire(import.meta.url);
let viteBin;
try {
  viteBin = require.resolve('vite/bin/vite.js');
} catch {
  console.error('Run npm install in examples/trust-receipts-showcase first.');
  process.exit(1);
}

const children = [];
function killAll() {
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
    }
  }
}
process.on('SIGINT', () => {
  killAll();
  process.exit(0);
});
process.on('SIGTERM', () => {
  killAll();
  process.exit(0);
});

const port = process.env.NEUS_MOCK_API_PORT || '8787';
const mock = spawn(process.execPath, [path.join(__dirname, 'mock-api.mjs')], {
  stdio: 'inherit',
  env: { ...process.env, NEUS_MOCK_API_PORT: port }
});
children.push(mock);

setTimeout(() => {
  if (mock.killed) return;
  if (!existsSync(viteBin)) {
    console.error('vite not found');
    process.exit(1);
  }
  const vite = spawn(process.execPath, [viteBin], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      VITE_NEUS_API_URL: `http://127.0.0.1:${port}`
    }
  });
  children.push(vite);
  vite.on('close', (code) => {
    killAll();
    process.exit(code ?? 0);
  });
}, 250);

mock.on('close', (code) => {
  if (code !== 0 && code != null) {
    killAll();
    process.exit(code);
  }
});
