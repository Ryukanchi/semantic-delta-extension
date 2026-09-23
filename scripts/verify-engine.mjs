import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const artifact = new URL('../vendor/semantic-delta-detector-1.0.3.tgz', import.meta.url);
const expected = '4e9301dd06691ab4d0144ed0aebd7a614174006075281c4a9189a4529e3eb2e0';
const actual = createHash('sha256').update(readFileSync(artifact)).digest('hex');

if (actual !== expected) {
    throw new Error(`Engine archive checksum mismatch: expected ${expected}, got ${actual}`);
}

console.log('Verified semantic-delta-detector 1.0.3 archive (SHA-256).');
