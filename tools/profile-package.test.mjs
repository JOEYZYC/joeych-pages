import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profileRoot = join(repositoryRoot, 'Profile');
const jekyllRoot = join(repositoryRoot, 'Jeklly');
const dataFiles = [
  'profile.yml',
  'projects.yml',
  'awards.yml',
  'publications.yml',
  'patents.yml',
  'thesis.yml',
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function listFiles(root, directory = '') {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else if (entry.isFile()) files.push(child.split(sep).join('/'));
  }
  return files.sort();
}

test('public package YAML and certificate sources resolve in byte-equivalent mirrors', async () => {
  // Given
  const yamlProgram = [
    'import json, pathlib, sys, yaml',
    'root = pathlib.Path(sys.argv[1])',
    'files = sys.argv[2:]',
    'documents = [yaml.safe_load((root / name).read_text(encoding="utf-8")) for name in files]',
    'def walk(value):',
    '  if isinstance(value, dict):',
    '    for key, child in value.items():',
    '      if key == "src" and isinstance(child, str): yield child',
    '      yield from walk(child)',
    '  elif isinstance(value, list):',
    '    for child in value: yield from walk(child)',
    'print(json.dumps({"document_count": len(documents), "sources": list(walk(documents))}))',
  ].join('\n');

  // When
  const parsed = JSON.parse(execFileSync('python', [
    '-c',
    yamlProgram,
    join(profileRoot, 'data'),
    ...dataFiles,
  ], { encoding: 'utf8' }));

  // Then
  assert.equal(parsed.document_count, 6);
  for (const file of dataFiles) {
    const source = await readFile(join(profileRoot, 'data', file));
    const mirror = await readFile(join(jekyllRoot, '_data', file));
    assert.equal(sha256(mirror), sha256(source));
  }
  for (const sourcePath of parsed.sources) {
    assert.match(sourcePath, /^assets\/img\/certificates\//);
    const relativePath = sourcePath.slice('assets/img/'.length);
    const source = await readFile(join(profileRoot, 'media', relativePath));
    const mirror = await readFile(join(jekyllRoot, 'assets', 'img', relativePath));
    assert.equal(sha256(mirror), sha256(source));
  }
});

test('media mirror contains exactly the canonical media path set and bytes', async () => {
  // Given
  const sourceRoot = join(profileRoot, 'media');
  const mirrorRoot = join(jekyllRoot, 'assets', 'img');

  // When
  const sourceFiles = await listFiles(sourceRoot);
  const mirrorFiles = await listFiles(mirrorRoot);

  // Then
  assert.deepEqual(mirrorFiles, sourceFiles);
  for (const file of sourceFiles) {
    assert.equal(
      sha256(await readFile(join(mirrorRoot, file))),
      sha256(await readFile(join(sourceRoot, file))),
      relative(repositoryRoot, join(sourceRoot, file)),
    );
  }
});
