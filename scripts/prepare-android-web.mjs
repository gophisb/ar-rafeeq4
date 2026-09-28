import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const www = path.join(root, 'www');

const excluded = new Set(['.git', '.github', 'android', 'node_modules', 'www', 'DECISIONS', 'EVALS', 'OPLOG']);

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

function copyTree(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const name = path.basename(src);
    if (excluded.has(name)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyTree(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const entry of fs.readdirSync(root)) {
  if (excluded.has(entry)) continue;
  if (entry === 'package.json' || entry === 'package-lock.json') continue;
  copyTree(path.join(root, entry), path.join(www, entry));
}

console.log('Prepared Capacitor web assets in www/');
