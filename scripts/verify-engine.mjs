import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const artifact = new URL('../vendor/semantic-delta-detector-1.1.0.tgz', import.meta.url);
const expected = 'e4e2ac364f0267a089867bde365fd26e2795fad3e6996c9e06d6cb075cd2b5bb';
const actual = createHash('sha256').update(readFileSync(artifact)).digest('hex');

if (actual !== expected) {
    throw new Error(`Engine archive checksum mismatch: expected ${expected}, got ${actual}`);
}

console.log('Verified semantic-delta-detector 1.1.0 archive (SHA-256).');
