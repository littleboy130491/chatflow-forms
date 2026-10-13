"""Rebuild the owned PHP/WordPress Jed catalogs from the reviewed Indonesian TSV."""
import gettext
import json
from pathlib import Path
import re
import struct
import subprocess

directory = Path(__file__).resolve().parent
root = directory.parents[2]
messages = json.loads(subprocess.check_output(['node', str(directory / 'extract.mjs'), str(root)], text=True))
translations = dict(line.split('|', 1) for line in (directory / 'id_ID.tsv').read_text().splitlines())
missing = set(messages) - translations.keys()
if missing:
    raise SystemExit('Missing translations: ' + ', '.join(sorted(missing)))
for source in messages:
    if sorted(re.findall(r'%(?:\d+\$)?[ds]', source)) != sorted(re.findall(r'%(?:\d+\$)?[ds]', translations[source])):
        raise SystemExit('Mismatched placeholders: ' + source)
header = 'Project-Id-Version: ChatFlow Forms\nLanguage: id_ID\nContent-Type: text/plain; charset=UTF-8\nContent-Transfer-Encoding: 8bit\nPlural-Forms: nplurals=1; plural=0;\n'
catalog = {'': header, **{message: translations[message] for message in messages}}
po = '\n\n'.join('msgid ' + json.dumps(key, ensure_ascii=False) + '\nmsgstr ' + json.dumps(value, ensure_ascii=False) for key, value in catalog.items()) + '\n'
(directory / 'chatflow-forms-id_ID.po').write_text(po)
items = sorted(catalog.items())
originals = b''.join(key.encode() + b'\0' for key, _ in items)
translated = b''.join(value.encode() + b'\0' for _, value in items)
count = len(items)
original_offset = 28 + 16 * count
translated_offset = original_offset + len(originals)
original_table, translated_table = [], []
for key, value in items:
    original_table.append(struct.pack('<II', len(key.encode()), original_offset))
    translated_table.append(struct.pack('<II', len(value.encode()), translated_offset))
    original_offset += len(key.encode()) + 1
    translated_offset += len(value.encode()) + 1
mo = struct.pack('<7I', 0x950412de, 0, count, 28, 28 + 8 * count, 0, 0) + b''.join(original_table) + b''.join(translated_table) + originals + translated
(directory / 'chatflow-forms-id_ID.mo').write_bytes(mo)
with (directory / 'chatflow-forms-id_ID.mo').open('rb') as stream:
    loaded = gettext.GNUTranslations(stream)
    assert all(loaded.gettext(message) == translations[message] for message in messages)
jed = {'domain': 'chatflow-forms', 'locale_data': {'messages': {'': {'domain': 'chatflow-forms', 'lang': 'id_ID', 'plural-forms': 'nplurals=1; plural=0;'}, **{message: [translations[message]] for message in messages}}}}
for handle in ['cff-builder', 'cff-submissions', 'cff-blocks']:
    (directory / f'chatflow-forms-id_ID-{handle}.json').write_text(json.dumps(jed, ensure_ascii=False, indent=2) + '\n')
print(f'Generated and verified {len(messages)} Indonesian messages in PHP and all three script catalogs.')
