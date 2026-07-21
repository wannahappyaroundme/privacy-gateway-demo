import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {brotliDecompressSync} from 'node:zlib';

import {describe, expect, it} from 'vitest';

import {COPY, FORBIDDEN_RENDERED_COPY} from '@/content/copy';
import {validateFixture} from '@/demo/schema';

const copyPath = resolve('src/content/copy.ts');
const fixturePath = resolve('src/demo/fixtures/synthetic-consultation-v1.json');
const manifestPath = resolve('release-manifest.json');
const noticesPath = resolve('THIRD_PARTY_NOTICES.md');
const regularFontPath = resolve('public/fonts/PrivacyDemoSans-Regular.woff2');
const boldFontPath = resolve('public/fonts/PrivacyDemoSans-Bold.woff2');
const glyphHelperPath = resolve('scripts/fonts/make-privacy-demo-glyphs.py');
const renameHelperPath = resolve('scripts/fonts/rename-privacy-demo-font.py');

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

const WOFF2_KNOWN_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill',
] as const;

function readUIntBase128(buffer: Buffer, cursor: {offset: number}): number {
  let result = 0;
  for (let count = 0; count < 5; count += 1) {
    const byte = buffer[cursor.offset++];
    if (count === 0 && byte === 0x80) throw new Error('Invalid UIntBase128');
    if ((result & 0xfe000000) !== 0) throw new Error('UIntBase128 overflow');
    result = (result << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return result;
  }
  throw new Error('UIntBase128 is too long');
}

function readWoff2Tables(fontPath: string): Map<string, Buffer> {
  const file = readFileSync(fontPath);
  expect(file.subarray(0, 4).toString('ascii')).toBe('wOF2');
  const tableCount = file.readUInt16BE(12);
  const compressedLength = file.readUInt32BE(20);
  const cursor = {offset: 48};
  const entries: {tag: string; length: number}[] = [];

  for (let index = 0; index < tableCount; index += 1) {
    const flags = file[cursor.offset++];
    const tagIndex = flags & 0x3f;
    const tag =
      tagIndex === 0x3f
        ? file.subarray(cursor.offset, (cursor.offset += 4)).toString('ascii')
        : WOFF2_KNOWN_TAGS[tagIndex];
    const originalLength = readUIntBase128(file, cursor);
    const transformVersion = flags >> 6;
    const transformed =
      tag === 'glyf' || tag === 'loca' ? transformVersion !== 3 : transformVersion !== 0;
    entries.push({
      tag,
      length: transformed ? readUIntBase128(file, cursor) : originalLength,
    });
  }

  const decompressed = brotliDecompressSync(
    file.subarray(cursor.offset, cursor.offset + compressedLength),
  );
  const tables = new Map<string, Buffer>();
  let tableOffset = 0;
  for (const entry of entries) {
    tables.set(entry.tag, decompressed.subarray(tableOffset, tableOffset + entry.length));
    tableOffset += entry.length;
  }
  expect(tableOffset).toBe(decompressed.length);
  return tables;
}

function addFormat4CodePoints(table: Buffer, offset: number, codePoints: Set<number>): void {
  const segmentCount = table.readUInt16BE(offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segmentCount * 2 + 2;
  const deltas = startCodes + segmentCount * 2;
  const rangeOffsets = deltas + segmentCount * 2;

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const start = table.readUInt16BE(startCodes + segment * 2);
    const end = table.readUInt16BE(endCodes + segment * 2);
    const delta = table.readInt16BE(deltas + segment * 2);
    const rangeOffsetPosition = rangeOffsets + segment * 2;
    const rangeOffset = table.readUInt16BE(rangeOffsetPosition);
    for (let codePoint = start; codePoint <= end && codePoint !== 0xffff; codePoint += 1) {
      let glyphId = 0;
      if (rangeOffset === 0) {
        glyphId = (codePoint + delta) & 0xffff;
      } else {
        const glyphPosition = rangeOffsetPosition + rangeOffset + (codePoint - start) * 2;
        if (glyphPosition + 2 <= table.length) glyphId = table.readUInt16BE(glyphPosition);
        if (glyphId !== 0) glyphId = (glyphId + delta) & 0xffff;
      }
      if (glyphId !== 0) codePoints.add(codePoint);
    }
  }
}

function addFormat12CodePoints(table: Buffer, offset: number, codePoints: Set<number>): void {
  const groupCount = table.readUInt32BE(offset + 12);
  for (let group = 0; group < groupCount; group += 1) {
    const groupOffset = offset + 16 + group * 12;
    const start = table.readUInt32BE(groupOffset);
    const end = table.readUInt32BE(groupOffset + 4);
    for (let codePoint = start; codePoint <= end; codePoint += 1) codePoints.add(codePoint);
  }
}

function fontCodePoints(fontPath: string): Set<number> {
  const table = readWoff2Tables(fontPath).get('cmap');
  if (!table) throw new Error('WOFF2 cmap table is missing');
  const codePoints = new Set<number>();
  const encodingCount = table.readUInt16BE(2);
  for (let index = 0; index < encodingCount; index += 1) {
    const subtableOffset = table.readUInt32BE(4 + index * 8 + 4);
    const format = table.readUInt16BE(subtableOffset);
    if (format === 4) addFormat4CodePoints(table, subtableOffset, codePoints);
    if (format === 12) addFormat12CodePoints(table, subtableOffset, codePoints);
  }
  return codePoints;
}

function fontNames(fontPath: string): string[] {
  const table = readWoff2Tables(fontPath).get('name');
  if (!table) throw new Error('WOFF2 name table is missing');
  const count = table.readUInt16BE(2);
  const stringsOffset = table.readUInt16BE(4);
  const names: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const recordOffset = 6 + index * 12;
    const platform = table.readUInt16BE(recordOffset);
    const length = table.readUInt16BE(recordOffset + 8);
    const offset = table.readUInt16BE(recordOffset + 10);
    const value = table.subarray(stringsOffset + offset, stringsOffset + offset + length);
    if (platform === 3) {
      const swapped = Buffer.alloc(value.length);
      for (let byte = 0; byte < value.length; byte += 2) {
        swapped[byte] = value[byte + 1];
        swapped[byte + 1] = value[byte];
      }
      names.push(swapped.toString('utf16le'));
    } else if (platform === 1) {
      names.push(value.toString('ascii'));
    }
  }
  return names;
}

describe('rendered copy contract', () => {
  it('uses product-workspace copy without the retired validation-plan story', () => {
    const rendered = collectStrings(COPY).join('\n');

    expect(rendered).toContain('AI 상담 요약 만들기');
    expect(rendered).toContain('AI가 상담 요약을 작성하고 있어요');
    expect(rendered).toContain('상담 요약이 준비되었습니다');
    expect(rendered).toContain('제품 콘셉트 데모 | 합성 예시 데이터');

    for (const removed of [
      '현업 대표 5명',
      '1인당 합성 과업 10건 이상',
      '실측 전 교차시험 설계',
      '검증 예정',
      '미실시',
      '30초 시연',
    ]) {
      expect(rendered, `retired demo copy: ${removed}`).not.toContain(removed);
    }
  });

  it('keeps reviewed product, scope, and five result fields exact', async () => {
    const fixture = await validateFixture(readFileSync(fixturePath, 'utf8'));

    expect(COPY.product.name).toBe('단디 DANDI');
    expect(COPY.product.category).toBe('금융 AI 개인정보 보호 게이트웨이');
    expect(COPY.product.memoryLine).toBe('허용된 업무만, 확인된 결과만');
    expect(COPY.verifiedResult).toEqual(fixture.verifiedResult);
    expect(COPY.scope.official).toBe('제품 콘셉트 데모 | 합성 예시 데이터');
    expect(COPY.scope.detail).toContain('실제 고객정보와 금융 시스템에는 연결되지 않습니다');
  });

  it('records durable exact font provenance without placeholders or temporary helpers', () => {
    const notices = readFileSync(noticesPath, 'utf8');
    const noticesWithoutGeneratedMarkers = notices
      .replace('<!-- BEGIN GENERATED NPM DEPENDENCIES -->', '')
      .replace('<!-- END GENERATED NPM DEPENDENCIES -->', '');

    expect(notices).toContain('- Source download date: `2026-07-18`');
    expect(notices).toContain(
      '- Source URL: `https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/17_NotoSansKR.zip`',
    );
    expect(noticesWithoutGeneratedMarkers).not.toMatch(/<[^>\n]+>/u);
    expect(notices).not.toMatch(/\/private\/tmp\/[^\s`]+\.py/u);

    for (const [relativePath, helperPath] of [
      ['scripts/fonts/make-privacy-demo-glyphs.py', glyphHelperPath],
      ['scripts/fonts/rename-privacy-demo-font.py', renameHelperPath],
    ] as const) {
      const helperHash = createHash('sha256').update(readFileSync(helperPath)).digest('hex');
      expect(notices).toContain(`\`${relativePath}\`: \`${helperHash}\``);
    }

    for (const weight of ['Regular', 'Bold']) {
      expect(notices).toContain(`/tmp/privacy-demo-font-build/NotoSansKR-${weight}.otf`);
      expect(notices).toContain(`public/fonts/PrivacyDemoSans-${weight}.woff2`);
    }
  });

  it('contains no forbidden rendered claim, brand, or em dash', () => {
    const rendered = collectStrings(COPY).join('\n');

    for (const forbidden of FORBIDDEN_RENDERED_COPY) {
      expect(rendered, `forbidden rendered copy: ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('keeps real-looking phone and account formats out of rendered copy', () => {
    const rendered = JSON.stringify(COPY);
    expect(rendered).not.toMatch(/01[016789]-?\d{3,4}-?\d{4}/u);
    expect(rendered).not.toMatch(/\b\d{2,4}-\d{2,6}-\d{2,6}\b/u);
  });

  it('keeps every rendered glyph in both licensed font subsets', () => {
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown;
    const rendered = collectStrings(COPY).concat(collectStrings(fixture)).join('');
    const required = new Set(
      Array.from(rendered, (character) => character.codePointAt(0)!).filter(
        (codePoint) => !/\s/u.test(String.fromCodePoint(codePoint)),
      ),
    );

    for (const fontPath of [regularFontPath, boldFontPath]) {
      const available = fontCodePoints(fontPath);
      const missing = [...required].filter((codePoint) => !available.has(codePoint));
      expect(missing.map((codePoint) => `U+${codePoint.toString(16).toUpperCase()}`)).toEqual([]);
    }
  });

  it('uses the modified family name in both font subsets', () => {
    for (const fontPath of [regularFontPath, boldFontPath]) {
      const names = fontNames(fontPath);
      expect(names).toContain('Privacy Demo Sans');
      expect(names).not.toContain('Noto Sans KR');
    }
  });

  it('records exact copy bytes and font output hashes', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {copySha256: string};
    const notices = readFileSync(noticesPath, 'utf8');
    const copyHash = createHash('sha256').update(readFileSync(copyPath)).digest('hex');

    expect(manifest.copySha256).toBe(copyHash);
    for (const [fileName, fontPath] of [
      ['PrivacyDemoSans-Regular.woff2', regularFontPath],
      ['PrivacyDemoSans-Bold.woff2', boldFontPath],
    ] as const) {
      const fontHash = createHash('sha256').update(readFileSync(fontPath)).digest('hex');
      expect(notices).toContain(`\`${fileName}\`: \`${fontHash}\``);
    }
  });
});
