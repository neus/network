#!/usr/bin/env node
/** Print CHANGELOG.md notes for a version (GitHub Release body). */
import { readFileSync } from 'fs';

const version = process.argv[2]?.replace(/^v/, '');
if (!version) {
  console.error('Usage: node scripts/extract-changelog-notes.mjs <version>');
  process.exit(1);
}

const escaped = version.replace(/\./g, '\\.');
const md = readFileSync('CHANGELOG.md', 'utf8');
const match = md.match(
  new RegExp(`## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`)
);

if (!match) {
  console.log(
    [
      `Release \`${version}\`.`,
      '',
      'Packages:',
      '',
      '```bash',
      `npm i @neus/sdk@${version}`,
      `npx -y -p @neus/sdk@${version} neus doctor --live`,
      '```',
      '',
      'See [CHANGELOG.md](./CHANGELOG.md) for details.',
    ].join('\n')
  );
  process.exit(0);
}

console.log(match[1].trim());
