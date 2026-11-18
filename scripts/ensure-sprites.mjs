import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'sprites-manifest.json');
const outDir = path.join(__dirname, '..', 'public', 'sprites');

fs.mkdirSync(outDir, { recursive: true });
const files = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const missing = files.filter((fn) => !fs.existsSync(path.join(outDir, fn)));
if (missing.length === 0) {
  console.log(`[ensure-sprites] All ${files.length} sprites already present.`);
  process.exit(0);
}

console.log(`[ensure-sprites] Fetching ${missing.length} sprites for static build...`);
const CONCURRENCY = 35;
let idx = 0;

async function fetchWithRetry(filename, retries = 3) {
  const url = `https://habitica-assets.s3.amazonaws.com/mobileApp/images/${filename}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(outDir, filename), buf);
      return;
    } catch (err) {
      if (attempt === retries) throw new Error(`Failed ${filename}: ${err}`);
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
}

async function worker() {
  while (idx < missing.length) {
    const current = missing[idx++];
    await fetchWithRetry(current);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
console.log(`[ensure-sprites] Successfully fetched ${missing.length} sprites.`);
