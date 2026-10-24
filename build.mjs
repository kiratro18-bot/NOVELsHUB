import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(projectRoot, 'www');
const excludedDirectories = new Set([
  '.git', '.agents', '.aws', '.codex', 'node_modules', 'www', 'android', 'ios'
]);
const excludedFiles = new Set([
  'package.json', 'package-lock.json', 'capacitor.config.json', 'build.mjs', 'README.md', '.gitignore'
]);

if (path.dirname(outputDir) !== projectRoot || path.basename(outputDir) !== 'www') {
  throw new Error('Refusing to build outside the project www directory.');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const entries = await readdir(projectRoot, { withFileTypes: true });
let copied = 0;
for (const entry of entries) {
  const source = path.join(projectRoot, entry.name);
  const destination = path.join(outputDir, entry.name);
  if (entry.isDirectory()) {
    if (excludedDirectories.has(entry.name)) continue;
    await cp(source, destination, { recursive: true });
    copied += 1;
  } else if (entry.isFile() && !excludedFiles.has(entry.name)) {
    const info = await stat(source);
    if (info.size === 0) continue;
    await cp(source, destination);
    copied += 1;
  }
}

console.log(`Built ${copied} site files/folders into ${path.relative(projectRoot, outputDir)}.`);
