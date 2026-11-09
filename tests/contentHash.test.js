import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { contentHash } from '../src/dropbox/dropbox.js';

const sha = (buf) => createHash('sha256').update(buf).digest();

test('small file: sha256 of the sha256 of the content', async () => {
  const bytes = new TextEncoder().encode('# 2026-11-01\nBodyweight: 182.6 lb\n');
  assert.equal(await contentHash(bytes), sha(sha(bytes)).toString('hex'));
});

test('multi-block file: sha256 of the concatenated block hashes', async () => {
  const block = 4 * 1024 * 1024;
  const bytes = new Uint8Array(block + 10).fill(7);
  const expected = createHash('sha256')
    .update(Buffer.concat([sha(bytes.slice(0, block)), sha(bytes.slice(block))]))
    .digest('hex');
  assert.equal(await contentHash(bytes), expected);
});

test('empty file does not throw', async () => {
  assert.equal(await contentHash(new Uint8Array(0)), sha(sha(Buffer.alloc(0))).toString('hex'));
});
