import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {describe, expect, it} from 'vitest';

describe('public repository boundary', () => {
  it('ignores secret and generated files', () => {
    const ignore = readFileSync('.gitignore', 'utf8');
    for (const entry of [
      '.env*',
      '*.pem',
      '*.key',
      '*.p12',
      'secrets/',
      'config/credentials*',
      'coverage/',
      'test-results/',
    ]) {
      expect(ignore).toContain(entry);
    }
  });

  it('does not contain private project documents', () => {
    for (const path of ['AGENTS.md', 'docs', 'tools/promo-video']) expect(existsSync(path)).toBe(false);
  });

  it('ignores a Git worktree pointer without allowing it into the release source', async () => {
    const root = mkdtempSync(join(tmpdir(), 'privacy-demo-worktree-'));
    try {
      writeFileSync(join(root, '.git'), 'gitdir: /temporary/worktree\n', 'utf8');
      writeFileSync(join(root, 'README.md'), 'public demo\n', 'utf8');
      const moduleUrl = pathToFileURL(resolve('scripts/release-workspace.mjs')).href;
      const {collectSourceEntries} = await import(moduleUrl) as {
        collectSourceEntries(path: string): Promise<Array<{path: string; bytes: Buffer}>>;
      };

      const entries = await collectSourceEntries(root);
      expect(entries.map(({path}) => path)).toEqual(['README.md']);
    } finally {
      rmSync(root, {recursive: true, force: true});
    }
  });

  it('ignores nested Git worktree directories during release collection', async () => {
    const root = mkdtempSync(join(tmpdir(), 'privacy-demo-release-root-'));
    try {
      const nested = join(root, '.worktrees', 'feature');
      mkdirSync(nested, {recursive: true});
      writeFileSync(join(root, 'README.md'), 'public demo\n', 'utf8');
      writeFileSync(join(nested, '.git'), 'gitdir: /temporary/worktree\n', 'utf8');
      writeFileSync(join(nested, 'README.md'), 'private worktree copy\n', 'utf8');
      const moduleUrl = pathToFileURL(resolve('scripts/release-workspace.mjs')).href;
      const {collectSourceEntries} = await import(moduleUrl) as {
        collectSourceEntries(path: string): Promise<Array<{path: string; bytes: Buffer}>>;
      };

      const entries = await collectSourceEntries(root);
      expect(entries.map(({path}) => path)).toEqual(['README.md']);
    } finally {
      rmSync(root, {recursive: true, force: true});
    }
  });
});
