import ast
import json
import re
import sys
from pathlib import Path
from typing import Iterator


def string_values(value: object) -> Iterator[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from string_values(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from string_values(item)


copy_path, fixture_path, output_path = map(Path, sys.argv[1:4])
copy_source = copy_path.read_text(encoding='utf-8').split(
    'export const FORBIDDEN_RENDERED_COPY', 1
)[0]
copy_strings = [
    ast.literal_eval("'" + match.group(1) + "'")
    for match in re.finditer(r"'((?:[^'\\]|\\.)*)'", copy_source)
]
fixture_strings = list(
    string_values(json.loads(fixture_path.read_text(encoding='utf-8')))
)
glyphs = ''.join(sorted(set(''.join(copy_strings + fixture_strings)), key=ord))
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(glyphs, encoding='utf-8')
print(f'{len(glyphs)} unique code points -> {output_path}')
