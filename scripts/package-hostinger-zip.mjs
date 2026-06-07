/**
 * Paket za Hostinger Node.js upload (ZIP deploy).
 * Run: node scripts/package-hostinger-zip.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'hostinger-deploy.zip');

const excludeDirs = new Set(['node_modules', 'dist', '.git', 'data', '.cursor']);
const excludeFiles = new Set(['hostinger-deploy.zip', '.env', '.env.local', 'aaa.pdf']);

function shouldInclude(relPath) {
  const parts = relPath.split(/[/\\]/);
  if (parts.some((p) => excludeDirs.has(p))) return false;
  if (excludeFiles.has(parts.at(-1))) return false;
  if (relPath.includes('export-backup')) return false;
  return true;
}

function collectFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (!shouldInclude(rel)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full, rel));
    else files.push({ rel: rel.replace(/\\/g, '/'), full });
  }
  return files;
}

if (fs.existsSync(out)) fs.unlinkSync(out);

const files = collectFiles(root);
const listFile = path.join(root, '.hostinger-zip-list.txt');
fs.writeFileSync(listFile, files.map((f) => f.full).join('\n'));

try {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path (Get-Content '${listFile.replace(/'/g, "''")}') -DestinationPath '${out.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit', cwd: root },
  );
  const sizeMb = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
  console.log(`\nOK: ${out} (${sizeMb} MB)`);
  console.log('Upload u Hostinger → Node.js Apps → Upload ZIP');
} finally {
  fs.unlinkSync(listFile);
}
