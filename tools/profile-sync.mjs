import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_FILES = [
  'profile.yml',
  'projects.yml',
  'awards.yml',
  'publications.yml',
  'patents.yml',
  'thesis.yml',
];

const PUBLIC_SOURCE_ROOTS = ['data', 'media'];
const CERTIFICATE_PATTERN = /src:\s*['"]?(assets\/img\/[^,'"}\r\n]+)/g;

class ProfileSyncError extends Error {}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function toPosix(path) {
  return path.split(sep).join('/');
}

function assertPublicSourcePath(path) {
  const normalized = toPosix(path);
  const segments = normalized.split('/');
  const publicRoot = segments[0];
  if (
    path !== normalized
    || path.startsWith('/')
    || segments.includes('..')
    || segments.includes('.')
    || !PUBLIC_SOURCE_ROOTS.includes(publicRoot)
  ) {
    throw new ProfileSyncError(`Source path is outside the public allowlist: ${path}`);
  }
}

async function listMediaFiles(mediaRoot, directory = '') {
  const entries = await readdir(join(mediaRoot, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    const child = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new ProfileSyncError(`Symbolic links are not allowed in Profile/media: ${toPosix(child)}`);
    }
    if (entry.isDirectory()) {
      files.push(...await listMediaFiles(mediaRoot, child));
    } else if (entry.isFile()) {
      files.push(toPosix(child));
    }
  }
  return files;
}

async function collectSourceEntries(roots, options = {}) {
  const dataFiles = options.dataFiles ?? DATA_FILES;
  const readSource = options.readSource ?? readFile;
  const dataPaths = dataFiles.map((file) => `data/${file}`);
  for (const path of dataPaths) assertPublicSourcePath(path);

  const mediaFiles = await listMediaFiles(join(roots.profileRoot, 'media'));
  const sourcePaths = [
    ...dataPaths,
    ...mediaFiles.map((file) => `media/${file}`),
  ];
  for (const path of sourcePaths) assertPublicSourcePath(path);

  const entries = [];
  for (const sourcePath of sourcePaths) {
    const source = join(roots.profileRoot, ...sourcePath.split('/'));
    const metadata = await lstat(source);
    if (!metadata.isFile()) {
      throw new ProfileSyncError(`Public source is not a regular file: ${sourcePath}`);
    }
    const bytes = await readSource(source);
    const destination = sourcePath.startsWith('data/')
      ? `_data/${sourcePath.slice('data/'.length)}`
      : `assets/img/${sourcePath.slice('media/'.length)}`;
    entries.push({ sourcePath, destination, bytes, sha256: sha256(bytes) });
  }
  return entries;
}

function createManifest(entries) {
  return `${JSON.stringify({
    schema_version: 1,
    algorithm: 'sha256',
    files: entries.map(({ sourcePath, destination, bytes, sha256: hash }) => ({
      source: `Profile/${sourcePath}`,
      destination: `Jeklly/${destination}`,
      bytes: bytes.length,
      sha256: hash,
    })),
  }, null, 2)}\n`;
}

async function validateCertificates(entries) {
  const availableMedia = new Set(
    entries
      .filter(({ sourcePath }) => sourcePath.startsWith('media/'))
      .map(({ sourcePath }) => `assets/img/${sourcePath.slice('media/'.length)}`),
  );
  for (const entry of entries.filter(({ sourcePath }) => sourcePath.startsWith('data/'))) {
    const text = entry.bytes.toString('utf8');
    for (const match of text.matchAll(CERTIFICATE_PATTERN)) {
      const certificatePath = match[1];
      if (!availableMedia.has(certificatePath)) {
        throw new ProfileSyncError(`Certificate source is missing from Profile/media: ${certificatePath}`);
      }
    }
  }
}

export async function writeProfileMirror(roots, options = {}) {
  const entries = await collectSourceEntries(roots, options);
  await validateCertificates(entries);
  await rm(join(roots.jekyllRoot, '_data'), { recursive: true, force: true });
  await rm(join(roots.jekyllRoot, 'assets', 'img'), { recursive: true, force: true });
  await rm(join(roots.jekyllRoot, '.generated'), { recursive: true, force: true });

  for (const entry of entries) {
    const destination = join(roots.jekyllRoot, ...entry.destination.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(roots.profileRoot, ...entry.sourcePath.split('/')), destination);
  }
  const manifestPath = join(roots.jekyllRoot, '.generated', 'profile-sync-manifest.json');
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, createManifest(entries));
}

async function listMirrorFiles(jekyllRoot) {
  const files = [];
  for (const directory of ['_data', 'assets/img']) {
    const root = join(jekyllRoot, ...directory.split('/'));
    const walk = async (current = '') => {
      const entries = await readdir(join(root, current), { withFileTypes: true });
      for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
        const child = join(current, entry.name);
        if (entry.isDirectory()) await walk(child);
        else if (entry.isFile()) files.push(`${directory}/${toPosix(child)}`);
      }
    };
    await walk();
  }
  return files.sort();
}

export async function checkProfileMirror(roots, options = {}) {
  const entries = await collectSourceEntries(roots, options);
  await validateCertificates(entries);
  const expectedPaths = entries.map(({ destination }) => destination).sort();
  const actualPaths = await listMirrorFiles(roots.jekyllRoot);
  const stalePaths = [];

  for (const entry of entries) {
    const bytes = await readFile(join(roots.jekyllRoot, ...entry.destination.split('/')));
    if (sha256(bytes) !== entry.sha256) stalePaths.push(entry.destination);
  }
  for (const path of actualPaths) {
    if (!expectedPaths.includes(path)) stalePaths.push(path);
  }
  for (const path of expectedPaths) {
    if (!actualPaths.includes(path)) stalePaths.push(path);
  }

  const manifest = await readFile(join(roots.jekyllRoot, '.generated', 'profile-sync-manifest.json'), 'utf8');
  if (manifest !== createManifest(entries)) stalePaths.push('.generated/profile-sync-manifest.json');
  return { ok: stalePaths.length === 0, stalePaths: [...new Set(stalePaths)].sort() };
}

async function main() {
  const mode = process.argv[2];
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const roots = {
    profileRoot: join(repositoryRoot, 'Profile'),
    jekyllRoot: join(repositoryRoot, 'Jeklly'),
  };

  if (mode === '--write') {
    await writeProfileMirror(roots);
    console.log('Profile mirror written.');
    return;
  }
  if (mode === '--check') {
    const result = await checkProfileMirror(roots);
    if (!result.ok) {
      throw new ProfileSyncError(`Profile mirror is stale: ${result.stalePaths.join(', ')}`);
    }
    console.log('Profile mirror is byte-equivalent.');
    return;
  }
  throw new ProfileSyncError('Usage: node tools/profile-sync.mjs --write|--check');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
