import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {collectSourceEntries} from './release-workspace.mjs';
import {hashBytes, hashSourceEntries} from './release-policy.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const MANIFEST_PATH = path.join(ROOT, 'release-manifest.json');
const FIXTURE_PATH = path.join(ROOT, 'src/demo/fixtures/synthetic-cases-v2.json');
const COPY_PATH = path.join(ROOT, 'src/content/copy.ts');

const prior = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const fixtureSha256 = hashBytes(await readFile(FIXTURE_PATH));
const copySha256 = hashBytes(await readFile(COPY_PATH));
const approvedSourceSha256 = hashSourceEntries(await collectSourceEntries(ROOT));
const approvalStillMatches =
  prior.status === 'public-release-approved' &&
  prior.approvedSourceSha256 === approvedSourceSha256 &&
  typeof prior.reviewer === 'string' &&
  typeof prior.approvedAt === 'string';

const manifest = {
  schemaVersion: '1.0',
  status: approvalStillMatches ? prior.status : 'local-preflight-only',
  fixtureSha256,
  copySha256,
  approvedSourceSha256,
  reviewer: approvalStillMatches ? prior.reviewer : null,
  approvedAt: approvalStillMatches ? prior.approvedAt : null,
};

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write('Release manifest updated; public approval was not granted.\n');
