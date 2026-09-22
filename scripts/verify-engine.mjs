import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const artifact = new URL('../vendor/semantic-delta-detector-1.0.2.tgz', import.meta.url);
const expected = '887d2b312d1517a20ca49775a19f6c18a2ac157f2e9d5b17e72ddce32fefd464';
const actual = createHash('sha256').update(readFileSync(artifact)).digest('hex');

if (actual !== expected) {
    throw new Error(`Engine archive checksum mismatch: expected ${expected}, got ${actual}`);
}

console.log('Verified semantic-delta-detector 1.0.2 archive (SHA-256).');
