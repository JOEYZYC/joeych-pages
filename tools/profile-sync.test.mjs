import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { checkProfileMirror, writeProfileMirror } from './profile-sync.mjs';

const DATA_FILES = [
  'profile.yml',
  'projects.yml',
  'awards.yml',
  'publications.yml',
  'patents.yml',
  'thesis.yml',
];

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'profile-sync-'));
  const profileRoot = join(root, 'Profile');
  const jekyllRoot = join(root, 'Jeklly');
  await mkdir(join(profileRoot, 'data'), { recursive: true });
  await mkdir(join(profileRoot, 'media', 'certificates'), { recursive: true });
  await mkdir(join(profileRoot, 'private'), { recursive: true });
  await mkdir(jekyllRoot, { recursive: true });

  for (const file of DATA_FILES) {
    await writeFile(join(profileRoot, 'data', file), `name: ${file}\n`);
  }
  await writeFile(join(profileRoot, 'media', 'certificates', 'proof.bin'), Buffer.from([0, 1, 2, 255]));
  await writeFile(join(profileRoot, 'private', 'contact.yml'), 'private-canary');

  return {
    root,
    roots: { profileRoot, jekyllRoot },
  };
}

test('check fails when a generated mirror byte is stale', async () => {
  // Given
  const fixture = await createFixture();
  try {
    await writeProfileMirror(fixture.roots);
    const mirror = join(fixture.roots.jekyllRoot, '_data', 'profile.yml');
    const bytes = await readFile(mirror);
    bytes[0] ^= 1;
    await writeFile(mirror, bytes);

    // When
    const result = await checkProfileMirror(fixture.roots);

    // Then
    assert.equal(result.ok, false);
    assert.deepEqual(result.stalePaths, ['_data/profile.yml']);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('escaped or private source paths are rejected before any read', async () => {
  // Given
  const fixture = await createFixture();
  let readCount = 0;
  const readSource = async (path) => {
    readCount += 1;
    return readFile(path);
  };

  try {
    // When
    await assert.rejects(
      writeProfileMirror(fixture.roots, {
        dataFiles: ['../private/contact.yml'],
        readSource,
      }),
      /Source path is outside the public allowlist/,
    );

    // Then
    assert.equal(readCount, 0);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
