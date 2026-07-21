const LICENSE_PRIORITY = ['license', 'license.md', 'license.txt', 'licence', 'notice'];

export function selectLicenseFile(entries) {
  const files = [...entries].sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  );
  for (const candidate of LICENSE_PRIORITY) {
    const matches = files.filter((entry) => entry.toLowerCase() === candidate);
    if (matches.length > 0) return matches[0];
  }
  return null;
}

export function noticeDifferencePreview(current, expected) {
  const currentLines = current.split('\n');
  const expectedLines = expected.split('\n');
  const limit = Math.max(currentLines.length, expectedLines.length);
  let index = 0;
  while (index < limit && currentLines[index] === expectedLines[index]) index += 1;
  return `THIRD_PARTY_NOTICES.md first differs at line ${index + 1}.\n` +
    `Current: ${currentLines[index] ?? '<missing>'}\n` +
    `Expected: ${expectedLines[index] ?? '<missing>'}\n`;
}
