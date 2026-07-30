import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , mode, firstPath, secondPath] = process.argv;

if (!['--write-baseline', '--compare'].includes(mode) || !firstPath || !secondPath) {
  throw new Error('Usage: node scripts/qa/css-audit.mjs --write-baseline <css> <baseline> | --compare <baseline> <css>');
}

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function findMatches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => ({ value: match[0], line: lineAt(source, match.index) }));
}

function audit(source) {
  const root = source.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const rootOffset = source.indexOf(root);
  const hexes = findMatches(source, /#[0-9a-fA-F]{3,8}\b/g)
    .filter((match) => match.line < lineAt(source, rootOffset) || match.line > lineAt(source, rootOffset + root.length));
  const transitionAll = findMatches(source, /transition\s*:\s*all\b/gi);
  const animationDeclarations = findMatches(source, /(?:transition|animation)(?:-[\w-]+)?\s*:[^;]*(?:\b(?:width|height|top|right|bottom|left|margin|padding|gap|grid-template(?:-columns|-rows)?|flex(?:-basis|-grow|shrink)?|display|position)\b)/gi);
  return {
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    nonTokenHex: hexes,
    transitionAll,
    layoutAnimation: animationDeclarations,
  };
}

function excessOccurrences(current, baseline) {
  const remaining = new Map();
  for (const entry of baseline) {
    remaining.set(entry.value, (remaining.get(entry.value) ?? 0) + 1);
  }
  return current.filter((entry) => {
    const count = remaining.get(entry.value) ?? 0;
    if (count === 0) return true;
    remaining.set(entry.value, count - 1);
    return false;
  });
}

if (mode === '--write-baseline') {
  const css = readFileSync(firstPath, 'utf8');
  const baseline = { generatedAt: new Date().toISOString(), cssPath: firstPath, ...audit(css) };
  mkdirSync(dirname(secondPath), { recursive: true });
  writeFileSync(secondPath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`CSS baseline written: ${secondPath}`);
} else {
  const baseline = JSON.parse(readFileSync(firstPath, 'utf8'));
  const current = audit(readFileSync(secondPath, 'utf8'));
  const failures = [
    ...excessOccurrences(current.nonTokenHex, baseline.nonTokenHex).map((entry) => `new non-token hex ${entry.value} at line ${entry.line}`),
    ...current.transitionAll.map((entry) => `transition: all at line ${entry.line}`),
    ...excessOccurrences(current.layoutAnimation, baseline.layoutAnimation).map((entry) => `layout animation at line ${entry.line}`),
  ];
  if (failures.length) throw new Error(`CSS audit failed:\n${failures.join('\n')}`);
  console.log('CSS audit OK: no new non-token hex or layout animation');
}
