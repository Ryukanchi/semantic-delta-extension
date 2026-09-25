import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const artifact = new URL('../vendor/semantic-delta-detector-1.0.4.tgz', import.meta.url);
const expected = '91564f45bb7f0c48af8cab99b827fdf622ce338d6f3ff28472d86ba5a622223d';
const actual = createHash('sha256').update(readFileSync(artifact)).digest('hex');

if (actual !== expected) {
    throw new Error(`Engine archive checksum mismatch: expected ${expected}, got ${actual}`);
}

console.log('Verified semantic-delta-detector 1.0.4 archive (SHA-256).');
