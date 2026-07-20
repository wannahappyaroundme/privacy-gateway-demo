import {existsSync, readFileSync} from 'node:fs';
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
});
