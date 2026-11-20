// Every milestone the player received is a file of its own, and it stays exactly as it was
// delivered: a new milestone is a new file, never an overwrite (the player's rule, M4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// In this repo (Aethermoor-m7-) the milestone the player got last, M7, is the frozen one. M2 to M6 stay frozen
// where they were delivered, in the New-game repo (game/dist/, branch claude/cool-ptolemy-uc93gg), with their hashes
// pinned by that repo's copy of this test.
const FROZEN = {
  'aethermoor-m7.html': 'ce769f22297891193ea95020c9c01c2688e85a10e8e5193339e568592948523b',
};

test('the delivered milestone files are byte for byte what the player got', () => {
  for (const [file, sha] of Object.entries(FROZEN)) {
    const got = createHash('sha256').update(readFileSync(new URL(`../dist/${file}`, import.meta.url))).digest('hex');
    assert.equal(got, sha, `dist/${file} changed: it is a delivered milestone and must never be rebuilt`);
  }
});
