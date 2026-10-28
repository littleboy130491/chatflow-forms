import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { __, resetLocaleData, setLocaleData } from '@wordpress/i18n';
describe('bundled Indonesian administration catalogs', () => {
  it('covers every owned static JS translation and preserves sprintf placeholders', () => {
    const catalog = JSON.parse(
      readFileSync('src/Admin/languages/chatflow-forms-id_ID-cff-builder.json', 'utf8'),
    ) as { locale_data: { messages: Record<string, string[]> } };
    const seen = new Set<string>();
    for (const directory of ['assets/src/builder', 'assets/src/submissions', 'assets/src/blocks'])
      for (const name of readdirSync(directory).filter((name) => /\.tsx?$/.test(name))) {
        const path = join(directory, name),
          ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
        function walk(node: ts.Node) {
          if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === '__' &&
            node.arguments[0] &&
            ts.isStringLiteral(node.arguments[0])
          )
            seen.add(node.arguments[0].text);
          ts.forEachChild(node, walk);
        }
        walk(ast);
      }
    expect(seen.size).toBeGreaterThan(400);
    for (const source of seen) {
      const translation = catalog.locale_data.messages[source]?.[0];
      expect(translation, source).toBeTruthy();
      expect(translation?.match(/%(?:\d+\$)?[ds]/g) ?? []).toEqual(source.match(/%(?:\d+\$)?[ds]/g) ?? []);
    }
    for (const handle of ['cff-submissions', 'cff-blocks'])
      expect(
        JSON.parse(readFileSync(`src/Admin/languages/chatflow-forms-id_ID-${handle}.json`, 'utf8')),
      ).toEqual(catalog);
  });
  it('loads in the actual WordPress i18n package without code or external requests', () => {
    const catalog = JSON.parse(
      readFileSync('src/Admin/languages/chatflow-forms-id_ID-cff-builder.json', 'utf8'),
    ) as { locale_data: { messages: Parameters<typeof setLocaleData>[0] } };
    setLocaleData(catalog.locale_data.messages, 'chatflow-forms');
    try {
      expect(__('Undo', 'chatflow-forms')).toBe('Urungkan');
      expect(__('Purge data', 'chatflow-forms')).toBe('Hapus data');
      expect(__('Type DELETE to confirm', 'chatflow-forms')).toBe('Ketik DELETE untuk konfirmasi');
    } finally {
      resetLocaleData({}, 'chatflow-forms');
    }
  });
});
