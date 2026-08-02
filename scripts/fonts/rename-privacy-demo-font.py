import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


source_path, output_path, family, subfamily, weight = sys.argv[1:6]
font = TTFont(source_path, recalcTimestamp=False)
font = instantiateVariableFont(font, {'wght': float(weight)}, inplace=True, optimize=True)
name_table = font['name']
compact_family = family.replace(' ', '')
full_name = f'{family} {subfamily}'
postscript_name = f'{compact_family}-{subfamily}'
unique_name = f'{postscript_name};2.004-modified'
replacements = {
    1: family,
    2: subfamily,
    3: unique_name,
    4: full_name,
    6: postscript_name,
    16: family,
    17: subfamily,
}

for record in name_table.names:
    replacement = replacements.get(record.nameID)
    if replacement is None:
        continue
    record.string = replacement.encode(record.getEncoding(), errors='replace')

for platform_id, encoding_id, language_id in [
    (3, 1, 0x409),
    (3, 10, 0x409),
    (1, 0, 0),
]:
    for name_id, replacement in replacements.items():
        name_table.setName(
            replacement,
            name_id,
            platform_id,
            encoding_id,
            language_id,
        )

Path(output_path).parent.mkdir(parents=True, exist_ok=True)
font.save(output_path, reorderTables=True)
