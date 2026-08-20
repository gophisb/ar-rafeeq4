import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const webDir = join(root, 'www');
const excluded = new Set(['.git', 'node_modules', 'android', 'www', 'scripts', 'package.json', 'package-lock.json', 'capacitor.config.ts']);

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

const entries = await (await import('node:fs/promises')).readdir(root, { withFileTypes: true });
for (const entry of entries) {
  if (excluded.has(entry.name)) continue;
  await cp(join(root, entry.name), join(webDir, entry.name), { recursive: true });
}

console.log(`Synced Ar-Rafeeq 4 web files to ${webDir}`);
