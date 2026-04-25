import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = path.resolve(here, '../..', '..');
const src = path.join(repoRoot, 'examples', 'shared', 'css', 'neus-tokens.css');
const destDir = path.join(here, '..', 'public');
const dest = path.join(destDir, 'neus-tokens.css');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
