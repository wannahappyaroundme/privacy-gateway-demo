import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

import {isAllowedRepositoryPath, isAllowedSourcePath} from './release-policy.mjs';

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.superpowers',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

async function walk(root, current = '') {
  const directory = path.join(root, current);
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const relative = current ? `${current}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (relative === 'artifacts/tmp') continue;
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) files.push(...(await walk(root, relative)));
      continue;
    }
    if (entry.isFile()) files.push(relative);
  }
  return files;
}

export async function collectSourceEntries(root) {
  const files = await walk(root);
  const unexpected = files.filter(
    (file) => file !== '.DS_Store' && !isAllowedRepositoryPath(file),
  );
  if (unexpected.length > 0) {
    throw new Error(`Unexpected public repository path: ${unexpected.sort()[0]}`);
  }
  const sourceFiles = files.filter(isAllowedSourcePath).sort();
  return Promise.all(
    sourceFiles.map(async (file) => ({path: file, bytes: await readFile(path.join(root, file))})),
  );
}
